// 配置相关类型定义

export interface WorldConfig {
  title: string
  description: string
  setting: string
  rules: string[]
  characters?: string
  initialStatus: Record<string, unknown>
}

export interface StatusConfig {
  fields: StatusField[]
}

export interface StatusField {
  key: string
  label: string
  type: 'number' | 'progress' | 'level' | 'text'
  defaultValue: number | string
  min?: number
  max?: number
  visible: boolean
}

export interface AIConfig {
  provider: 'deepseek' | 'gemini' | 'siliconflow'
  apiKey: string
  model: string
  parameters: Record<string, unknown>
}

export interface PresetConfig {
  id: string
  name: string
  description: string
  world: WorldConfig
  status: StatusConfig
  ai?: Partial<AIConfig>
  version: string
  createdAt: number
}
