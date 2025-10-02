// 游戏相关类型定义
// 基于API接口文档的完整游戏数据结构

import { UserInputType, FieldType } from './enums'

// ============== 用户输入相关 ==============
export interface UserInput {
  id: string
  type: UserInputType
  content: string
  timestamp: number
  metadata?: InputMetadata
}

export interface InputMetadata {
  optionId?: string
  shortcutKey?: string
  inputMethod?: string
  deviceType?: string
}

// ============== 游戏选项 ==============
export interface GameOption {
  id: string                    // 选项ID (A/B/C)
  text: string                  // 选项文本
  description?: string          // 选项描述
  enabled: boolean              // 是否可用
  shortcut?: string             // 快捷键
  icon?: string                 // 图标
  metadata?: OptionMetadata     // 选项元数据
}

export interface OptionMetadata {
  type?: string
  difficulty?: number
  consequences?: string[]
  requirements?: string[]
}

// ============== 游戏状态相关 ==============
export interface GameStatus {
  [fieldName: string]: StatusFieldValue
}

export type StatusFieldValue = number | ProgressValue | TextValue | LevelValue

export interface ProgressValue {
  value: number
  max: number
  color?: string
  label?: string
}

export interface TextValue {
  value: string
  format?: string
}

export interface LevelValue {
  level: number
  experience: number
  nextLevelExp: number
  maxLevel?: number
}

export type PrimitiveValue = string | number | boolean | null

export type CardValue =
  | PrimitiveValue
  | PrimitiveValue[]
  | Record<string, PrimitiveValue | PrimitiveValue[]>

// ============== 状态字段定义 ==============
export interface StatusField {
  id: string
  name: string                  // 内部字段名
  displayName: string           // 显示名称
  type: FieldType               // 字段类型
  config: FieldConfig           // 字段配置
  order: number                 // 排序
  visible: boolean              // 是否可见
  required: boolean             // 是否必需
}

export type FieldConfig = Record<string, unknown>


export interface ProgressFieldConfig extends Record<string, unknown> {
  min: number
  max: number
  initial: number
  color: string
  showPercentage: boolean
}

export interface NumberFieldConfig extends Record<string, unknown> {
  initial: number
  min?: number
  max?: number
  format: string
}

// ============== 自定义扩展数据 ==============
export interface CustomData {
  [cardName: string]: CardValue | Record<string, CardValue> | undefined       // 已配置的扩展卡片数据
  _extra?: Record<string, CardValue>  // 未配置的额外数据
}

// ============== 解析后的游戏数据 ==============
export interface ParsedGameData {
  scene: string                 // 场景描述
  narration: string             // 旁白内容
  options: GameOption[]         // 游戏选项
  status: GameStatus            // 游戏状态
  custom: CustomData            // 自定义扩展数据
}

// ============== 游戏回合 ==============
export interface GameRound {
  id: string
  round: number
  userInput?: UserInput
  aiResponse: ParsedGameData
  timestamp: number
  processingTime?: number
}

// ============== 完整游戏状态 ==============
export interface GameState {
  // 基础游戏信息
  gameId: string
  worldId: string
  currentRound: number
  totalRounds: number
  
  // 玩家状态
  playerStatus: Record<string, StatusFieldValue>  // 动态状态字段
  
  // 游戏历史
  history: GameRound[]
  
  // 当前回合数据
  currentRoundData: {
    scene: string
    narration: string
    options: GameOption[]
    userInput?: string
    timestamp: number
  }
  
  // 扩展数据
  customData: Record<string, CardValue>
  
  // 元数据
  metadata: {
    createdAt: number
    updatedAt: number
    version: string
  }
}

// ============== 游戏统计 ==============
export interface GameStatistics {
  totalPlayTime: number         // 总游戏时间(秒)
  totalRounds: number           // 总回合数
  totalInputs: number           // 总输入次数
  averageRoundTime: number      // 平均回合时间
  aiRequestCount: number        // AI请求次数
  totalTokensUsed: number       // 总token使用量
  achievementsUnlocked: string[] // 解锁成就
  customStats: Record<string, CardValue> // 自定义统计
}

// ============== 处理结果 ==============
export interface ProcessResult {
  success: boolean
  data?: ParsedGameData
  error?: unknown
  timestamp: number
}

// ============== 状态更新 ==============
export interface StateUpdate {
  path: string
  value: unknown
  operation: 'set' | 'merge' | 'delete'
  timestamp?: number
}

// ============== 游戏状态快照 ==============
export interface GameStateSnapshot {
  id: string
  gameState: GameState
  timestamp: number
  checksum: string
}

// ============== 状态补丁 ==============
export interface StatePatch {
  updates: StateUpdate[]
  timestamp: number
  source: string
}

// ============== 状态变化回调 ==============
export type StateChangeCallback = (newState: GameState, oldState: GameState, path: string) => void

// ============== 取消订阅函数 ==============
export type UnsubscribeFunction = () => void

// ============== 保存结果 ==============
export interface SaveResult {
  success: boolean
  saveId?: string
  error?: string
  timestamp: number
}

// ============== 加载结果 ==============
export interface LoadResult {
  success: boolean
  gameState?: GameState
  error?: string
  timestamp: number
}

// ============== 兼容旧版本类型（向后兼容） ==============
export interface StatusItem {
  name: string
  value: number | string
  max?: number
  type: "progress" | "number" | "text"
}

export interface ActionOption {
  id: string
  text: string
}

export interface Quest {
  name: string
  status: "进行中" | "已完成" | "未开始"
  progress: number
}

export interface Relationship {
  name: string
  level: number
  maxLevel: number
}


