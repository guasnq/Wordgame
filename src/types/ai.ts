// AI服务相关类型定义

export interface AIServiceConfig {
  provider: 'deepseek' | 'gemini' | 'siliconflow'
  apiKey: string
  baseUrl?: string
  model?: string
  parameters?: AIParameters
}

export interface AIParameters {
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

export interface AIRequest {
  messages: AIMessage[]
  model: string
  temperature?: number
  max_tokens?: number
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: AIChoice[]
  usage?: AIUsage
}

export interface AIChoice {
  index: number
  message: AIMessage
  finish_reason: string
}

export interface AIUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}
