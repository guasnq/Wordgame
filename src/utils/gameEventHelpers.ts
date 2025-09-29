import { EventBusManager } from '@/modules/core/eventBus'
import { GameEvent } from '@/types/enums'

/**
 * 游戏事件帮助器 - 兼容层
 * 为现有业务代码提供简单的事件发射接口
 */
export const gameEventHelpers = {
  // 用户交互事件发射器
  emitOptionSelected: (optionId: 'A' | 'B' | 'C', optionText: string) => {
    EventBusManager.getInstance().getEventBus().emit(GameEvent.USER_OPTION_SELECTED, { 
      optionId, 
      optionText 
    })
  },

  emitUserInputSubmitted: (input: string) => {
    EventBusManager.getInstance().getEventBus().emit(GameEvent.USER_INPUT_SUBMITTED, { 
      input 
    })
  },

  // 游戏状态事件发射器
  emitGameStarted: () => {
    EventBusManager.getInstance().getEventBus().emit(GameEvent.GAME_STARTED, { 
      timestamp: Date.now() 
    })
  },

  emitGameReset: () => {
    EventBusManager.getInstance().getEventBus().emit(GameEvent.GAME_RESET, { 
      timestamp: Date.now() 
    })
  },

  emitRoundStarted: (roundNumber: number) => {
    EventBusManager.getInstance().getEventBus().emit(GameEvent.ROUND_STARTED, { 
      roundNumber 
    })
  },

  emitRoundCompleted: (roundNumber: number, data: unknown) => {
    EventBusManager.getInstance().getEventBus().emit(GameEvent.ROUND_COMPLETED, { 
      roundNumber, 
      data 
    })
  },

  // AI相关事件发射器
  emitAIRequestStarted: (prompt: string) => {
    EventBusManager.getInstance().getEventBus().emit(GameEvent.AI_REQUEST_STARTED, { 
      prompt 
    })
  },

  emitAIRequestCompleted: (response: unknown) => {
    EventBusManager.getInstance().getEventBus().emit(GameEvent.AI_REQUEST_COMPLETED, { 
      response 
    })
  },

  emitAIRequestFailed: (error: string) => {
    EventBusManager.getInstance().getEventBus().emit(GameEvent.AI_REQUEST_FAILED, { 
      error 
    })
  },

  // 错误事件发射器
  emitError: (error: string, context?: unknown) => {
    EventBusManager.getInstance().getEventBus().emit(GameEvent.ERROR_OCCURRED, { 
      error, 
      context 
    })
  },

  // 调试事件发射器
  emitDebugMessage: (message: string, data?: unknown) => {
    EventBusManager.getInstance().getEventBus().emit(GameEvent.DEBUG_MESSAGE, { 
      message, 
      data 
    })
  }
}

// 兼容的事件总线接口
export const gameEventBus = {
  emit: (event: string, data: unknown) => {
    EventBusManager.getInstance().getEventBus().emit(event, data)
  },

  on: (event: string, handler: (data: unknown) => void) => {
    return EventBusManager.getInstance().getEventBus().on(event, handler)
  },

  off: (event: string, handler: (data: unknown) => void) => {
    EventBusManager.getInstance().getEventBus().off(event, handler)
  },

  once: (event: string, handler: (data: unknown) => void) => {
    return EventBusManager.getInstance().getEventBus().once(event, handler)
  }
}

export default gameEventBus