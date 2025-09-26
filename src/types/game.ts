// 游戏相关类型定义

export interface UserInput {
  type: 'user_input' | 'option_click'
  content: string
  option_id?: 'A' | 'B' | 'C'
  timestamp: number
}

export interface GameOption {
  id: 'A' | 'B' | 'C'
  text: string
}

export interface GameState {
  scene: string
  narration: string
  options: GameOption[]
  status: Record<string, unknown>
  custom?: Record<string, unknown>
  round: number
  timestamp: number
}

export interface GameHistory {
  rounds: GameState[]
  maxRounds: number
}
