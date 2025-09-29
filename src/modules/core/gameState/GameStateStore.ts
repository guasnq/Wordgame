// @ts-nocheck
/**
 * 重构后的游戏状态Store
 * 基于API接口文档的完整GameState接口
 * 集成CircularBuffer和状态快照功能
 */

import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { 
  GameState, 
  GameRound, 
  StateUpdate, 
  GameStateSnapshot,
  ParsedGameData,
  StatusFieldValue,
  CardValue
} from '@/types/game'
import { UserInputType } from '@/types/enums'
import { GameHistoryBuffer } from './CircularBuffer'
import { StateSnapshotManager } from './StateSnapshot'

/**
 * 游戏状态Store接口
 * 扩展了基础GameState，添加了操作方法
 */
export interface GameStateStore extends GameState {
  // ============== 状态管理方法 ==============
  
  /**
   * 初始化游戏状态
   * @param config 初始化配置
   */
  initializeGame(config: GameInitConfig): void

  /**
   * 更新游戏状态
   * @param updates 状态更新数组
   */
  applyUpdates(updates: StateUpdate[]): void

  /**
   * 开始新回合
   * @param roundData 回合数据
   */
  startNewRound(roundData: ParsedGameData): void

  /**
   * 完成当前回合
   * @param userInput 用户输入
   */
  completeRound(userInput?: string): void

  /**
   * 更新玩家状态
   * @param updates 状态更新
   */
  updatePlayerStatus(updates: Record<string, StatusFieldValue>): void

  /**
   * 更新扩展数据
   * @param data 扩展数据
   */
  updateCustomData(data: Record<string, CardValue>): void

  // ============== 历史记录管理 ==============

  /**
   * 获取历史记录
   * @param count 获取数量
   */
  getHistory(count?: number): GameRound[]

  /**
   * 获取指定回合记录
   * @param roundNumber 回合号
   */
  getRoundRecord(roundNumber: number): GameRound | undefined

  /**
   * 清除历史记录
   */
  clearHistory(): void

  // ============== 快照管理 ==============

  /**
   * 创建状态快照
   * @param description 描述
   */
  createSnapshot(description?: string): GameStateSnapshot

  /**
   * 回滚到快照
   * @param snapshotId 快照ID
   */
  rollbackToSnapshot(snapshotId: string): boolean

  /**
   * 回滚指定步数
   * @param steps 回滚步数
   */
  rollbackSteps(steps: number): boolean

  /**
   * 获取所有快照
   */
  getSnapshots(): GameStateSnapshot[]

  // ============== 游戏控制 ==============

  /**
   * 重置游戏
   */
  resetGame(): void

  /**
   * 暂停/恢复游戏
   */
  togglePause(): void

  /**
   * 设置加载状态
   */
  setLoading(loading: boolean): void

  /**
   * 设置错误状态
   */
  setError(error: string | null): void

  // ============== 内部状态（不暴露给外部） ==============
  _historyBuffer: GameHistoryBuffer<GameRound>
  _snapshotManager: StateSnapshotManager
  _isLoading: boolean
  _error: string | null
  _isPaused: boolean
}

/**
 * 游戏初始化配置
 */
export interface GameInitConfig {
  gameId?: string
  worldId?: string
  playerStatus?: Record<string, StatusFieldValue>
  customData?: Record<string, CardValue>
  maxHistoryRounds?: number
}

/**
 * 创建初始状态
 */
function createInitialState(): Omit<GameStateStore, keyof GameStateActions> {
  const now = Date.now()
  
  return {
    // 基础游戏信息
    gameId: '',
    worldId: '',
    currentRound: 0,
    totalRounds: 0,
    
    // 玩家状态（动态字段）
    playerStatus: {},
    
    // 游戏历史
    history: [],
    
    // 当前回合数据
    currentRoundData: {
      scene: "欢迎来到AI文字游戏世界！请配置您的世界观设定和角色状态后开始游戏。",
      narration: "系统正在等待您的配置...",
      options: [
        { id: 'A', text: '配置世界观设定', enabled: true },
        { id: 'B', text: '配置角色状态', enabled: true },
        { id: 'C', text: '开始游戏', enabled: false },
      ],
      timestamp: now
    },
    
    // 扩展数据
    customData: {},
    
    // 元数据
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: '1.0.0'
    },

    // 内部状态
    _historyBuffer: new GameHistoryBuffer<GameRound>(200),
    _snapshotManager: new StateSnapshotManager({
      maxSnapshots: 50,
      autoSnapshot: true,
      autoSnapshotInterval: 5
    }),
    _isLoading: false,
    _error: null,
    _isPaused: false
  }
}

/**
 * 状态操作方法类型
 */
type GameStateActions = {
  initializeGame: (config: GameInitConfig) => void
  applyUpdates: (updates: StateUpdate[]) => void
  startNewRound: (roundData: ParsedGameData) => void
  completeRound: (userInput?: string) => void
  updatePlayerStatus: (updates: Record<string, StatusFieldValue>) => void
  updateCustomData: (data: Record<string, CardValue>) => void
  getHistory: (count?: number) => GameRound[]
  getRoundRecord: (roundNumber: number) => GameRound | undefined
  clearHistory: () => void
  createSnapshot: (description?: string) => GameStateSnapshot
  rollbackToSnapshot: (snapshotId: string) => boolean
  rollbackSteps: (steps: number) => boolean
  getSnapshots: () => GameStateSnapshot[]
  resetGame: () => void
  togglePause: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

/**
 * 创建游戏状态Store
 */
export const useGameStateStore = create<GameStateStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...createInitialState(),

        // ============== 状态管理方法 ==============

        initializeGame: (config: GameInitConfig) => {
          set((state) => {
            state.gameId = config.gameId || `game_${Date.now()}`
            state.worldId = config.worldId || ''
            state.playerStatus = config.playerStatus || {}
            state.customData = config.customData || {}
            state.currentRound = 0
            state.totalRounds = 0
            state.metadata.updatedAt = Date.now()

            // 重新初始化历史缓冲区
            if (config.maxHistoryRounds) {
              state._historyBuffer = new GameHistoryBuffer<GameRound>(config.maxHistoryRounds)
            }

            // 创建初始快照
            setTimeout(() => {
              get().createSnapshot('Game initialized')
            }, 0)
          })
        },

        applyUpdates: (updates: StateUpdate[]) => {
          set((state) => {
            for (const update of updates) {
              const pathParts = update.path.split('.')
              let target: Record<string, unknown> = state as Record<string, unknown>
              
              // 导航到目标对象
              for (let i = 0; i < pathParts.length - 1; i++) {
                if (!target[pathParts[i]]) {
                  target[pathParts[i]] = {}
                }
                target = target[pathParts[i]] as Record<string, unknown>
              }
              
              const finalKey = pathParts[pathParts.length - 1]
              
              switch (update.operation) {
                case 'set':
                  target[finalKey] = update.value
                  break
                case 'merge':
                  if (typeof target[finalKey] === 'object' && typeof update.value === 'object') {
                    target[finalKey] = { ...target[finalKey], ...update.value }
                  } else {
                    target[finalKey] = update.value
                  }
                  break
                case 'delete':
                  delete target[finalKey]
                  break
              }
            }
            
            state.metadata.updatedAt = Date.now()
          })
        },

        startNewRound: (roundData: ParsedGameData) => {
          set((state) => {
            state.currentRound += 1
            state.totalRounds = Math.max(state.totalRounds, state.currentRound)
            
            // 更新当前回合数据
            state.currentRoundData = {
              scene: roundData.scene,
              narration: roundData.narration,
              options: roundData.options,
              timestamp: Date.now()
            }
            
            // 更新玩家状态
            if (roundData.status) {
              state.playerStatus = { ...state.playerStatus, ...roundData.status }
            }
            
            // 更新扩展数据
            if (roundData.custom) {
              state.customData = { ...state.customData, ...roundData.custom }
            }
            
            state.metadata.updatedAt = Date.now()

            // 自动快照检查
            state._snapshotManager.autoSnapshotCheck(state as GameState)
          })
        },

        completeRound: (userInput?: string) => {
          set((state) => {
            // 创建回合记录
            const roundRecord: GameRound = {
              id: `round_${state.currentRound}_${Date.now()}`,
              round: state.currentRound,
              userInput: userInput ? {
                id: `input_${Date.now()}`,
                type: UserInputType.TEXT_INPUT,
                content: userInput,
                timestamp: Date.now()
              } : undefined,
              aiResponse: {
                scene: state.currentRoundData.scene,
                narration: state.currentRoundData.narration,
                options: state.currentRoundData.options,
                status: state.playerStatus,
                custom: state.customData
              },
              timestamp: Date.now()
            }

            // 添加到历史缓冲区
            state._historyBuffer.addRound(roundRecord)
            
            // 更新history数组以保持兼容性
            state.history = state._historyBuffer.toArray()
            
            state.metadata.updatedAt = Date.now()
          })
        },

        updatePlayerStatus: (updates: Record<string, StatusFieldValue>) => {
          set((state) => {
            state.playerStatus = { ...state.playerStatus, ...updates }
            state.metadata.updatedAt = Date.now()
          })
        },

        updateCustomData: (data: Record<string, CardValue>) => {
          set((state) => {
            state.customData = { ...state.customData, ...data }
            state.metadata.updatedAt = Date.now()
          })
        },

        // ============== 历史记录管理 ==============

        getHistory: (count?: number) => {
          const state = get()
          if (count) {
            return state._historyBuffer.getLatest(count)
          }
          return state._historyBuffer.toArray()
        },

        getRoundRecord: (roundNumber: number) => {
          const state = get()
          return state._historyBuffer.getRoundByNumber(roundNumber)
        },

        clearHistory: () => {
          set((state) => {
            state._historyBuffer.clear()
            state.history = []
            state.metadata.updatedAt = Date.now()
          })
        },

        // ============== 快照管理 ==============

        createSnapshot: (description?: string) => {
          const state = get()
          const snapshot = state._snapshotManager.createSnapshot(
            state as GameState,
            description
          )
          return snapshot
        },

        rollbackToSnapshot: (snapshotId: string) => {
          const state = get()
          const snapshot = state._snapshotManager.getSnapshot(snapshotId)
          
          if (!snapshot) {
            return false
          }

          // 验证快照
          const validation = state._snapshotManager.validateSnapshot(snapshot)
          if (!validation.valid) {
            console.error('Invalid snapshot:', validation.errors)
            return false
          }

          set(() => ({
            ...snapshot.gameState,
            _historyBuffer: state._historyBuffer,
            _snapshotManager: state._snapshotManager,
            _isLoading: false,
            _error: null,
            _isPaused: false
          }))

          return true
        },

        rollbackSteps: (steps: number) => {
          const state = get()
          const snapshots = state._snapshotManager.getRecentSnapshots(steps + 1)
          
          if (snapshots.length <= steps) {
            return false
          }

          const targetSnapshot = snapshots[snapshots.length - steps - 1]
          return get().rollbackToSnapshot(targetSnapshot.id)
        },

        getSnapshots: () => {
          const state = get()
          return state._snapshotManager.getAllSnapshots()
        },

        // ============== 游戏控制 ==============

        resetGame: () => {
          set(() => ({
            ...createInitialState()
          }))
        },

        togglePause: () => {
          set((state) => {
            state._isPaused = !state._isPaused
          })
        },

        setLoading: (loading: boolean) => {
          set((state) => {
            state._isLoading = loading
          })
        },

        setError: (error: string | null) => {
          set((state) => {
            state._error = error
          })
        }
      }))
    ),
    {
      name: 'game-state-store',
      partialize: (state: GameStateStore) => ({
        // 持久化主要游戏数据，排除内部状态
        gameId: state.gameId,
        worldId: state.worldId,
        currentRound: state.currentRound,
        currentRoundData: state.currentRoundData,
        totalRounds: state.totalRounds,
        playerStatus: state.playerStatus,
        customData: state.customData,
        metadata: state.metadata,
        // 历史记录通过历史缓冲区管理，这里只保存数组形式以兼容
        history: state.history.slice(-50) // 只持久化最近50回合
      })
    }
  )
)

// ============== 选择器优化 ==============

/**
 * 优化的状态选择器
 * 使用细粒度选择器提高性能
 */
export const gameStateSelectors = {
  // 基础状态
  useGameId: () => useGameStateStore((state) => state.gameId),
  useCurrentRound: () => useGameStateStore((state) => state.currentRound),
  useIsLoading: () => useGameStateStore((state) => state._isLoading),
  useError: () => useGameStateStore((state) => state._error),
  useIsPaused: () => useGameStateStore((state) => state._isPaused),

  // 游戏内容
  useCurrentRoundData: () => useGameStateStore((state) => state.currentRoundData),
  usePlayerStatus: () => useGameStateStore((state) => state.playerStatus),
  useCustomData: () => useGameStateStore((state) => state.customData),

  // 历史记录
  useRecentHistory: (count: number = 10) => useGameStateStore((state) => 
    state._historyBuffer.getLatest(count)
  ),
  useHistoryStats: () => useGameStateStore((state) => ({
    totalRounds: state._historyBuffer.getSize(),
    capacity: state._historyBuffer.getCapacity(),
    isFull: state._historyBuffer.isFull()
  })),

  // 快照
  useSnapshotStats: () => useGameStateStore((state) => 
    state._snapshotManager.getStatistics()
  ),

  // 游戏元数据
  useGameMetadata: () => useGameStateStore((state) => state.metadata)
}

/**
 * 游戏状态Store的高级Hook
 */
export const useGameStateAdvanced = () => {
  const store = useGameStateStore()
  
  return {
    // 基础状态
    ...store,
    
    // 便捷方法
    isGameInitialized: !!store.gameId,
    canRollback: store.getSnapshots().length > 1,
    historyStats: {
      current: store._historyBuffer.getSize(),
      max: store._historyBuffer.getCapacity(),
      percentage: (store._historyBuffer.getSize() / store._historyBuffer.getCapacity()) * 100
    },
    
    // 状态查询
    findRoundByNumber: (roundNumber: number) => store.getRoundRecord(roundNumber),
    getRecentRounds: (count: number) => store.getHistory(count),
    
    // 批量更新
    batchUpdate: (updates: StateUpdate[]) => {
      store.applyUpdates(updates)
    }
  }
}





