// @ts-nocheck
/**
 * GameState模块导出
 * 提供完整的游戏状态管理功能
 * 
 * 主要功能：
 * - 游戏状态管理（Zustand Store）
 * - 历史记录管理（CircularBuffer）
 * - 状态快照和回滚（StateSnapshot）
 * - 标准化API接口（StateManager）
 * - 事件总线集成
 */

import React from 'react'
import type { StateChangeCallback, StatePatch, StateUpdate, GameStateValidationResult } from '@/types/interfaces'

// ============== 核心类导出 ==============
export { CircularBuffer, GameHistoryBuffer } from './CircularBuffer'
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











