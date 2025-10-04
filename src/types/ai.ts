// AI服务相关类型定义
// 支持三个主要AI服务商：DeepSeek、Gemini、SiliconFlow

import {
  AIServiceType,
  AIProvider,
  SiliconFlowService
} from './enums'
import { StatusConfig, ExtensionConfig } from './config'
import { BaseError, ErrorCode } from './error'
import type { ParsedGameData as GameParsedData } from './game'

// ============== 通用AI服务接口 ==============
export interface AIServiceAdapter {
  // 基础连接管理
  initialize(config: AIConfig): Promise<void>
  disconnect(): Promise<void>
  
  // 请求处理
  sendRequest(request: AIRequest): Promise<AIResponse>
  testConnection(): Promise<ConnectionTestResult>
  
  // 状态管理
  getConnectionStatus(): ConnectionStatus
  getUsageStats(): UsageStats

  // 遥测信息
  getTelemetry(): AdapterTelemetrySnapshot

  // 错误处理
  handleError(error: Error): ProcessedError
}

// ============== AI请求数据结构 ==============
export interface AIRequest {
  id: string
  prompt: string
  config: RequestConfig
  metadata: RequestMetadata
  timestamp: number
}

export interface RequestConfig {
  temperature: number
  maxTokens: number
  timeout: number
  retryAttempts: number
  stream: boolean
}

export interface RequestMetadata {
  gameRound: number
  worldId: string
  statusConfig: StatusConfig
  extensions: ExtensionConfig[]
}

// ============== AI响应数据结构 ==============
export interface AIResponse {
  id: string
  success: boolean
  data?: GameParsedData
  error?: APIError
  metadata: ResponseMetadata
  timestamp: number
}

export interface ResponseMetadata {
  processingTime: number
  tokenUsage: TokenUsage
  modelUsed: string
  apiVersion: string
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

// ============== AI服务配置 ==============
export interface AIConfig {
  id: string
  name: string
  serviceType: AIServiceType
  connection: ConnectionConfig
  parameters: AIParameters
  advanced: AdvancedConfig
  version: string
  createdAt: number
  updatedAt: number
}

export interface ConnectionConfig {
  apiUrl: string
  apiKey: string
  model: string
  timeout: number
  maxRetries: number
  retryDelay: number
}

// ============== DeepSeek特定配置 ==============
export interface DeepSeekConfig extends ConnectionConfig {
  supportReasoning: boolean
  enableCache: boolean
  cacheStrategy: 'auto' | 'manual'
  compatibilityMode: 'openai' | 'anthropic' | 'native'
  reasoningModeEnabled?: boolean
}

// ============== Gemini特定配置 ==============
export interface GeminiConfig extends ConnectionConfig {
  authType: 'api_key' | 'oauth2'
  projectId?: string
  enableMultimodal: boolean
  liveApiEnabled: boolean
}

// ============== SiliconFlow特定配置 ==============
export interface SiliconFlowConfig extends ConnectionConfig {
  serviceTypes: SiliconFlowService[]
  batchEnabled: boolean
  voiceEnabled: boolean
  balanceThreshold: number
}

// ============== AI参数配置 ==============
export interface AIParameters {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  stopSequences: string[]
  
  // 扩展参数（根据不同服务商支持情况）
  topK?: number
  repetitionPenalty?: number
  systemPrompt?: string
  responseFormat?: 'text' | 'json' | 'structured'
  
  // DeepSeek特定参数
  enableReasoning?: boolean
  reasoningDepth?: number
  
  // Gemini特定参数
  candidateCount?: number
  safetySettings?: SafetySetting[]
  
  // SiliconFlow特定参数
  stream?: boolean
  enableCustomVoice?: boolean
}

export interface SafetySetting {
  category: 'HARM_CATEGORY_HARASSMENT' | 'HARM_CATEGORY_HATE_SPEECH' | 'HARM_CATEGORY_SEXUALLY_EXPLICIT' | 'HARM_CATEGORY_DANGEROUS_CONTENT'
  threshold: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE'
}

// ============== 高级配置 ==============
export interface AdvancedConfig {
  useStreaming: boolean
  enableCaching: boolean
  cacheExpiration: number
  enableCompression: boolean
  customHeaders: Record<string, string>
  
  // 错误处理
  fallbackModel?: string
  autoSwitchOnError: boolean
  errorThreshold: number
  
  // 性能优化
  connectionPooling: boolean
  keepAlive: boolean
  compressionLevel: number
  
  // 监控和日志
  enableMetrics: boolean
  enableTracing: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  
  // 实验性功能
  experimentalFeatures: {
    enableFunctionCalling: boolean
    enableToolUse: boolean
    enableMultimodalInput: boolean
    enableBatchProcessing: boolean
  }
}

// ============== 连接测试结果 ==============
export interface ConnectionTestResult {
  success: boolean
  responseTime: number
  error?: string
  details?: {
    apiVersion?: string
    modelAvailable?: boolean
    quotaRemaining?: number
    features?: string[]
  }
}

// ============== 连接状态 ==============
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// ============== 使用统计 ==============
export interface UsageStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  totalTokensUsed: number
  averageResponseTime: number
  lastRequestTime?: number
  errorRate: number
}

// ============== 适配器遥测快照 ==============
export interface ConnectionMetrics {
  status: ConnectionStatus
  totalAttempts: number
  successfulConnections: number
  consecutiveFailures: number
  lastConnectedAt?: number
  lastDisconnectedAt?: number
  lastLatency?: number
  averageLatency?: number
  lastError?: unknown
}

export interface AdapterConnectionTelemetry {
  status: ConnectionStatus
  metrics: ConnectionMetrics
  lastTestResult?: ConnectionTestResult
}

export interface AdapterTelemetrySnapshot {
  usage: UsageStats
  connection: AdapterConnectionTelemetry
}

// ============== 处理后的错误 ==============
export interface ProcessedError extends BaseError {
  provider: AIProvider
  recoveryAction?: RecoveryAction
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'switch_model' | 'user_action'
  params?: Record<string, unknown>
}

// ============== API错误 ==============
export interface APIError {
  code: ErrorCode
  message: string
  details?: string
  provider: AIProvider
  retryable: boolean
  retryAfter?: number
}

// ============== DeepSeek请求体 ==============
export interface DeepSeekRequestBody {
  model: string
  messages: AIMessage[]
  temperature: number
  max_tokens: number
  stream: boolean
  reasoning?: boolean
  stop?: string[]
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  repetition_penalty?: number
  compatibility_mode?: 'openai' | 'anthropic' | 'native'
  kv_cache?: {
    enabled: boolean
    strategy: 'auto' | 'manual'
  }
}
// ============== Gemini请求体 ==============
export interface GeminiRequestBody {
  contents: GeminiContent[]
  generationConfig: GeminiGenerationConfig
  safetySettings?: SafetySetting[]
}

export interface GeminiContent {
  parts: GeminiPart[]
}

export interface GeminiPart {
  text: string
}

export interface GeminiGenerationConfig {
  temperature: number
  maxOutputTokens: number
  topP?: number
  topK?: number
}

// ============== SiliconFlow请求体 ==============
export interface SiliconFlowRequestBody {
  model: string
  messages: AIMessage[]
  temperature: number
  max_tokens: number
  stream: boolean
  service_type?: SiliconFlowService
}

// ============== 通用AI消息格式 ==============
export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// ============== 用户信息（SiliconFlow） ==============
export interface UserInfo {
  balance: string
  totalBalance: string
  chargeBalance: string
  status: string
}

// ============== 兼容旧版本类型 ==============
export interface AIServiceConfig {
  provider: 'deepseek' | 'gemini' | 'siliconflow'
  apiKey: string
  baseUrl?: string
  model?: string
  parameters?: AIParameters
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




