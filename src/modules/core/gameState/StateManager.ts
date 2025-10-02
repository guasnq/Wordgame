/**
 * 状态管理器
 * 实现API接口文档3.1.2节StateManagerAPI的所有方法
 * 包装GameStateStore并提供标准化接口
 */

import { 
  StateManagerAPI, 
  GameStateSnapshot, 
  StatePatch, 
  StateChangeCallback, 
  UnsubscribeFunction,
  ValidationResult,
  EventBusAPI
} from '@/types/interfaces'
import { StateUpdate, ParsedGameData } from '@/types/game'
import { useGameStateStore, GameInitConfig } from './GameStateStore'
import type { GameStateStore } from './GameStateStore'
import { EventBusManager } from '../eventBus/EventBusManager'
import { GameEvent } from '@/types/enums'

interface StateStatistics {

  gameInfo: {
    gameId: string
    worldId: string
    currentRound: number
    totalRounds: number
    isLoading: boolean
    isPaused: boolean
    error: string | null
  }
  historyStats: ReturnType<GameStateStore['_historyBuffer']['getMemoryUsage']> | null
  snapshotStats: ReturnType<GameStateStore['_snapshotManager']['getStatistics']> | null
  memoryUsage: {
    subscriptions: number
    totalCallbacks: number
  }
}

/**
 * 状态管理器实现类
 */
export class StateManager implements StateManagerAPI {
  private store: typeof useGameStateStore
  private eventBus: EventBusAPI
  private subscriptions: Map<string, Set<StateChangeCallback>>
  private unsubscribeFunctions: Map<StateChangeCallback, UnsubscribeFunction>

  constructor() {
    this.store = useGameStateStore
    this.eventBus = EventBusManager.getInstance().getEventBus()
    this.subscriptions = new Map()
    this.unsubscribeFunctions = new Map()
    
    this.initializeEventIntegration()
  }

  /**
   * 获取状态快照
   */
  getSnapshot(): GameStateSnapshot {
    const state = this.store.getState()
    return state.createSnapshot('Manual snapshot')
  }

  /**
   * 应用状态更新
   * @param patch 状态补丁
   */
  applyPatch(patch: StatePatch): void {
    try {
      const state = this.store.getState()
      
      // 验证补丁
      const validation = this.validatePatch(patch)
      if (!validation.isValid) {
        throw new Error(`Invalid patch: ${validation.errors.join(', ')}`)
      }

      // 创建更新前快照（如果需要）
      if (patch.updates.length > 0) {
        const preUpdateSnapshot = this.getSnapshot()
        this.notifyBeforeUpdate(preUpdateSnapshot, patch)
      }

      // 应用更新
      state.applyUpdates(patch.updates)
      
      // 发布状态变化事件
      this.publishStateChangeEvents(patch)
      
      // 通知订阅者
      this.notifySubscribers(patch)

    } catch (error) {
      console.error('Failed to apply patch:', error)
      this.eventBus.emit(GameEvent.STATE_ERROR, {
        error,
        patch,
        timestamp: Date.now()
      })
      throw error
    }
  }

  /**
   * 订阅状态变化
   * @param path 监听路径
   * @param callback 回调函数
   * @returns 取消订阅函数
   */
  subscribe(path: string, callback: StateChangeCallback): UnsubscribeFunction {
    // 添加到订阅列表
    if (!this.subscriptions.has(path)) {
      this.subscriptions.set(path, new Set())
    }
    this.subscriptions.get(path)!.add(callback)

    // 创建Zustand订阅
    const unsubscribe = this.store.subscribe(
      (state) => this.getValueByPath(state, path),
      (newValue, previousValue) => {
        if (newValue !== previousValue) {
          callback(newValue, previousValue, path)
        }
      }
    )

    // 存储取消订阅函数
    const unsubscribeWrapper = () => {
      const pathSubscriptions = this.subscriptions.get(path)
      if (pathSubscriptions) {
        pathSubscriptions.delete(callback)
        if (pathSubscriptions.size === 0) {
          this.subscriptions.delete(path)
        }
      }
      this.unsubscribeFunctions.delete(callback)
      unsubscribe()
    }

    this.unsubscribeFunctions.set(callback, unsubscribeWrapper)
    return unsubscribeWrapper
  }

  /**
   * 回滚到之前状态
   * @param steps 回滚步数
   */
  rollback(steps: number): boolean {
    try {
      const state = this.store.getState()
      const success = state.rollbackSteps(steps)
      
      if (success) {
        this.eventBus.emit(GameEvent.STATE_ROLLBACK, {
          steps,
          timestamp: Date.now(),
          currentRound: state.currentRound
        })
        
        // 通知所有订阅者状态已回滚
        this.notifyRollback(steps)
      }
      
      return success
    } catch (error) {
      console.error('Rollback failed:', error)
      return false
    }
  }

  /**
   * 验证状态完整性
   */
  validateState(): GameStateValidationResult {
    try {
      const state = this.store.getState()
      const errors: string[] = []
      const warnings: string[] = []

      // 验证基础字段
      if (!state.gameId) {
        errors.push('Missing gameId')
      }

      if (!state.worldId) {
        warnings.push('Missing worldId - game not fully initialized')
      }

      if (typeof state.currentRound !== 'number' || state.currentRound < 0) {
        errors.push('Invalid currentRound value')
      }

      if (!state.metadata) {
        errors.push('Missing metadata')
      } else {
        if (!state.metadata.createdAt) {
          errors.push('Missing metadata.createdAt')
        }
        if (!state.metadata.version) {
          warnings.push('Missing metadata.version')
        }
      }

      // 验证历史记录
      if (!Array.isArray(state.history)) {
        errors.push('Invalid history format')
      }

      // 验证玩家状态
      if (!state.playerStatus || typeof state.playerStatus !== 'object') {
        errors.push('Invalid playerStatus')
      }

      // 验证当前回合数据
      if (!state.currentRoundData || typeof state.currentRoundData !== 'object') {
        errors.push('Invalid currentRoundData')
      } else {
        if (!state.currentRoundData.scene) {
          warnings.push('Missing scene in currentRoundData')
        }
        if (!Array.isArray(state.currentRoundData.options)) {
          warnings.push('Invalid options in currentRoundData')
        }
      }

      // 验证历史缓冲区状态
      if (state._historyBuffer) {
        const historyStats = state._historyBuffer.getMemoryUsage()
        if (historyStats.utilizationRate > 0.9) {
          warnings.push('History buffer nearly full')
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: []
      }
    }
  }

  // ============== 扩展方法（超出API接口的便捷方法） ==============

  /**
   * 初始化游戏状态
   * @param config 初始化配置
   */
  initializeGame(config: GameInitConfig): void {
    const state = this.store.getState()
    state.initializeGame(config)
    
    this.eventBus.emit(GameEvent.GAME_STARTED, {
      gameId: config.gameId,
      worldId: config.worldId,
      timestamp: Date.now()
    })
  }

  /**
   * 开始新回合
   * @param roundData 回合数据
   */
  startNewRound(roundData: ParsedGameData): void {
    const state = this.store.getState()
    const previousRound = state.currentRound
    
    state.startNewRound(roundData)
    
    this.eventBus.emit(GameEvent.ROUND_STARTED, {
      round: state.currentRound,
      previousRound,
      timestamp: Date.now()
    })
  }

  /**
   * 完成当前回合
   * @param userInput 用户输入
   */
  completeRound(userInput?: string): void {
    const state = this.store.getState()
    const roundNumber = state.currentRound
    
    state.completeRound(userInput)
    
    this.eventBus.emit(GameEvent.ROUND_COMPLETED, {
      round: roundNumber,
      userInput,
      timestamp: Date.now()
    })
  }

  /**
   * 批量更新状态
   * @param updates 更新数组
   */
  batchUpdate(updates: StateUpdate[]): void {
    const patch: StatePatch = {
      updates,
      timestamp: Date.now(),
      source: 'StateManager.batchUpdate'
    }
    
    this.applyPatch(patch)
  }

  /**
   * 创建手动快照
   * @param description 快照描述
   */
  createManualSnapshot(description: string): GameStateSnapshot {
    const state = this.store.getState()
    const snapshot = state.createSnapshot(description)
    
    this.eventBus.emit(GameEvent.SNAPSHOT_CREATED, {
      snapshotId: snapshot.id,
      description,
      timestamp: snapshot.timestamp
    })
    
    return snapshot
  }

  /**
   * 获取状态统计信息
   */
  getStateStatistics(): StateStatistics {
    const state = this.store.getState()
    const historyStats = state._historyBuffer?.getMemoryUsage() ?? null
    const snapshotStats = state._snapshotManager?.getStatistics() ?? null

    return {
      gameInfo: {
        gameId: state.gameId,
        worldId: state.worldId,
        currentRound: state.currentRound,
        totalRounds: state.totalRounds,
        isLoading: state._isLoading,
        isPaused: state._isPaused,
        error: state._error
      },
      historyStats,
      snapshotStats,
      memoryUsage: {
        subscriptions: this.subscriptions.size,
        totalCallbacks: Array.from(this.subscriptions.values())
          .reduce((sum, set) => sum + set.size, 0)
      }
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    // 清除所有订阅
    for (const unsubscribe of this.unsubscribeFunctions.values()) {
      unsubscribe()
    }
    this.subscriptions.clear()
    this.unsubscribeFunctions.clear()
  }

  // ============== 私有方法 ==============

  /**
   * 初始化事件集成
   */
  private initializeEventIntegration(): void {
    // 监听Zustand store的变化并发布相应事件
    this.store.subscribe(
      (state) => state.currentRound,
      (currentRound, previousRound) => {
        if (currentRound !== previousRound) {
          this.eventBus.emit(GameEvent.STATE_CHANGED, {
            field: 'currentRound',
            newValue: currentRound,
            oldValue: previousRound,
            timestamp: Date.now()
          })
        }
      }
    )

    this.store.subscribe(
      (state) => state.playerStatus,
      (newStatus, oldStatus) => {
        if (newStatus !== oldStatus) {
          this.eventBus.emit(GameEvent.STATUS_UPDATED, {
            newStatus,
            oldStatus,
            timestamp: Date.now()
          })
        }
      }
    )
  }

  /**
   * 验证状态补丁
   */
  private validatePatch(patch: StatePatch): ValidationResult {
    const errors: string[] = []
    
    if (!patch.updates || !Array.isArray(patch.updates)) {
      errors.push('Invalid updates format')
    }
    
    if (!patch.timestamp) {
      errors.push('Missing timestamp')
    }
    
    for (const update of patch.updates || []) {
      if (!update.path) {
        errors.push('Update missing path')
      }
      if (!update.operation || !['set', 'merge', 'delete'].includes(update.operation)) {
        errors.push(`Invalid operation: ${update.operation}`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 根据路径获取值
   */
  private getValueByPath(source: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((current, key) => {
      if (current !== null && typeof current === 'object' && key in (current as Record<string, unknown>)) {
        return (current as Record<string, unknown>)[key]
      }
      return undefined
    }, source)
  }
/**
   * 发布状态变化事件
   */
  private publishStateChangeEvents(patch: StatePatch): void {
    this.eventBus.emit(GameEvent.STATE_CHANGED, {
      patch,
      timestamp: Date.now()
    })
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(patch: StatePatch): void {
    const state = this.store.getState()
    
    for (const update of patch.updates) {
      const pathSubscriptions = this.subscriptions.get(update.path)
      if (pathSubscriptions) {
        const newValue = this.getValueByPath(state, update.path)
        for (const callback of pathSubscriptions) {
          try {
            callback(newValue, undefined, update.path)
          } catch (error) {
            console.error('Subscription callback error:', error)
          }
        }
      }
    }
  }

  /**
   * 更新前通知
   */
  private notifyBeforeUpdate(snapshot: GameStateSnapshot, patch: StatePatch): void {
    this.eventBus.emit(GameEvent.STATE_BEFORE_UPDATE, {
      snapshot,
      patch,
      timestamp: Date.now()
    })
  }

  /**
   * 回滚通知
   */
  private notifyRollback(_steps: number): void {
    // 通知所有订阅者状态已发生重大变化
    const state = this.store.getState()
    for (const [path, callbacks] of this.subscriptions) {
      const currentValue = this.getValueByPath(state, path)
      for (const callback of callbacks) {
        try {
          callback(currentValue, undefined, path)
        } catch (error) {
          console.error('Rollback notification error:', error)
        }
      }
    }
  }
}

/**
 * 全局状态管理器实例
 */
let stateManagerInstance: StateManager | null = null

/**
 * 获取状态管理器单例
 */
export const getStateManager = (): StateManager => {
  if (!stateManagerInstance) {
    stateManagerInstance = new StateManager()
  }
  return stateManagerInstance
}

/**
 * 重置状态管理器（主要用于测试）
 */
export const resetStateManager = (): void => {
  if (stateManagerInstance) {
    stateManagerInstance.dispose()
    stateManagerInstance = null
  }
}

/**
 * React Hook for using StateManager
 */
export const useStateManager = () => {
  return getStateManager()
}



















