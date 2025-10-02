/**
 * GameState 模块入口
 * 提供游戏状态管理、历史记录以及快照回滚等能力的统一导出
 */

export { CircularBuffer, GameHistoryBuffer } from './CircularBuffer'
export * from './GameStateStore'
export * from './StateManager'
export * from './StateSnapshot'

export type {
  GameState,
  GameRound,
  StateUpdate,
  StatePatch,
  GameStateSnapshot,
  StateChangeCallback,
  UnsubscribeFunction,
  GameStateValidationResult
} from '@/types/interfaces'
