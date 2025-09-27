// 事件类型定义
export interface GameEvents {
  // 用户交互事件
  'option-selected': { optionId: 'A' | 'B' | 'C'; optionText: string }
  'user-input-submitted': { input: string }
  'scene-updated': { scene: string }
  'narration-updated': { narration: string }
  
  // 游戏状态事件
  'game-started': { timestamp: number }
  'game-reset': { timestamp: number }
  'round-started': { roundNumber: number }
  'round-completed': { roundNumber: number; data: any }
  
  // AI相关事件
  'ai-request-started': { prompt: string }
  'ai-request-completed': { response: any }
  'ai-request-failed': { error: string }
  
  // 状态更新事件
  'status-updated': { statusItems: Array<any> }
  'quests-updated': { quests: Array<any> }
  'relationships-updated': { relationships: Array<any> }
  'inventory-updated': { inventory: Array<any> }
  
  // 错误和调试事件
  'error-occurred': { error: string; context?: any }
  'debug-message': { message: string; data?: any }
}

// 事件监听器类型
type EventListener<T = any> = (data: T) => void | Promise<void>
type EventMap = { [K in keyof GameEvents]: EventListener<GameEvents[K]>[] }

// 事件总线类
class EventBus {
  private listeners: Partial<EventMap> = {}
  private debugMode = process.env.NODE_ENV === 'development'

  // 订阅事件
  on<K extends keyof GameEvents>(
    event: K,
    listener: EventListener<GameEvents[K]>
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    
    this.listeners[event]!.push(listener)
    
    if (this.debugMode) {
      console.log(`[EventBus] Subscribed to '${event}' event`)
    }
    
    // 返回取消订阅函数
    return () => this.off(event, listener)
  }

  // 取消订阅事件
  off<K extends keyof GameEvents>(
    event: K,
    listener: EventListener<GameEvents[K]>
  ): void {
    if (!this.listeners[event]) return
    
    const index = this.listeners[event]!.indexOf(listener)
    if (index > -1) {
      this.listeners[event]!.splice(index, 1)
      
      if (this.debugMode) {
        console.log(`[EventBus] Unsubscribed from '${event}' event`)
      }
    }
  }

  // 发射事件
  emit<K extends keyof GameEvents>(
    event: K,
    data: GameEvents[K]
  ): void {
    if (this.debugMode) {
      console.log(`[EventBus] Emitting '${event}' event:`, data)
    }
    
    if (!this.listeners[event]) return
    
    // 异步执行所有监听器
    this.listeners[event]!.forEach(async (listener) => {
      try {
        await listener(data)
      } catch (error) {
        console.error(`[EventBus] Error in '${event}' listener:`, error)
        
        // 发射错误事件（避免无限循环）
        if (event !== 'error-occurred') {
          this.emit('error-occurred', {
            error: `Event listener error in '${event}': ${error}`,
            context: { originalEvent: event, originalData: data }
          })
        }
      }
    })
  }

  // 一次性订阅事件
  once<K extends keyof GameEvents>(
    event: K,
    listener: EventListener<GameEvents[K]>
  ): () => void {
    const onceListener = (data: GameEvents[K]) => {
      listener(data)
      this.off(event, onceListener as EventListener<GameEvents[K]>)
    }
    
    return this.on(event, onceListener as EventListener<GameEvents[K]>)
  }

  // 清除所有监听器
  clear(): void {
    this.listeners = {}
    
    if (this.debugMode) {
      console.log('[EventBus] All listeners cleared')
    }
  }

  // 清除特定事件的所有监听器
  clearEvent<K extends keyof GameEvents>(event: K): void {
    delete this.listeners[event]
    
    if (this.debugMode) {
      console.log(`[EventBus] All listeners for '${event}' cleared`)
    }
  }

  // 获取事件监听器数量
  getListenerCount<K extends keyof GameEvents>(event: K): number {
    return this.listeners[event]?.length || 0
  }

  // 获取所有事件名称
  getEventNames(): Array<keyof GameEvents> {
    return Object.keys(this.listeners) as Array<keyof GameEvents>
  }

  // 启用/禁用调试模式
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }
}

// 创建全局事件总线实例
export const gameEventBus = new EventBus()

// 事件总线Hook
export const useEventBus = () => {
  return gameEventBus
}

// 便捷的Hook用于监听特定事件
export const useGameEvent = <K extends keyof GameEvents>(
  event: K,
  listener: EventListener<GameEvents[K]>,
  deps?: React.DependencyList
) => {
  React.useEffect(() => {
    const unsubscribe = gameEventBus.on(event, listener)
    return unsubscribe
  }, deps)
}

// React Hook用于发射事件
export const useEmitEvent = () => {
  return React.useCallback(<K extends keyof GameEvents>(
    event: K,
    data: GameEvents[K]
  ) => {
    gameEventBus.emit(event, data)
  }, [])
}

// 导入React for hooks
import React from 'react'

// 导出常用的事件处理工具
export const gameEventHelpers = {
  // 用户交互事件发射器
  emitOptionSelected: (optionId: 'A' | 'B' | 'C', optionText: string) => {
    gameEventBus.emit('option-selected', { optionId, optionText })
  },

  emitUserInputSubmitted: (input: string) => {
    gameEventBus.emit('user-input-submitted', { input })
  },

  // 游戏状态事件发射器
  emitGameStarted: () => {
    gameEventBus.emit('game-started', { timestamp: Date.now() })
  },

  emitGameReset: () => {
    gameEventBus.emit('game-reset', { timestamp: Date.now() })
  },

  emitRoundStarted: (roundNumber: number) => {
    gameEventBus.emit('round-started', { roundNumber })
  },

  emitRoundCompleted: (roundNumber: number, data: any) => {
    gameEventBus.emit('round-completed', { roundNumber, data })
  },

  // AI相关事件发射器
  emitAIRequestStarted: (prompt: string) => {
    gameEventBus.emit('ai-request-started', { prompt })
  },

  emitAIRequestCompleted: (response: any) => {
    gameEventBus.emit('ai-request-completed', { response })
  },

  emitAIRequestFailed: (error: string) => {
    gameEventBus.emit('ai-request-failed', { error })
  },

  // 错误事件发射器
  emitError: (error: string, context?: any) => {
    gameEventBus.emit('error-occurred', { error, context })
  },

  // 调试事件发射器
  emitDebugMessage: (message: string, data?: any) => {
    gameEventBus.emit('debug-message', { message, data })
  }
}

export default gameEventBus