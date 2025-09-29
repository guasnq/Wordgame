// 错误处理相关类型定义
// 基于错误分类与重试策略文档的完整错误类型系统

import { 
  ErrorSeverity, 
  ErrorCategory, 
  RecoveryStrategy, 
  RetryStrategy, 
  CircuitBreakerState, 
  AIProvider,
  LogLevel,
  ParseStage
} from './enums'

// ============== 错误码定义 ==============
export enum ErrorCode {
  // 通用错误 (1000-1999)
  UNKNOWN_ERROR = 1000,
  INVALID_PARAMETER = 1001,
  MISSING_PARAMETER = 1002,
  VALIDATION_FAILED = 1003,
  PERMISSION_DENIED = 1004,
  OPERATION_TIMEOUT = 1005,
  
  // 网络错误 (1000-1099)
  CONNECTION_FAILED = 1010,
  CONNECTION_TIMEOUT = 1011,
  DNS_RESOLUTION_FAILED = 1012,
  SSL_HANDSHAKE_FAILED = 1013,
  PROXY_ERROR = 1014,
  NETWORK_UNREACHABLE = 1015,
  CONNECTION_RESET = 1016,
  TOO_MANY_REQUESTS = 1017,
  BANDWIDTH_EXCEEDED = 1018,
  FIREWALL_BLOCKED = 1019,
  
  // 存储错误 (1100-1199)
  QUOTA_EXCEEDED = 1100,
  ACCESS_DENIED = 1101,
  ITEM_NOT_FOUND = 1102,
  CORRUPTION_DETECTED = 1103,
  WRITE_FAILED = 1104,
  READ_FAILED = 1105,
  DELETE_FAILED = 1106,
  LOCK_TIMEOUT = 1107,
  TRANSACTION_FAILED = 1108,
  BACKUP_FAILED = 1109,
  
  // 业务级错误 (2000-2999)
  INVALID_FORMAT = 2000,
  FIELD_REQUIRED = 2001,
  VALUE_TOO_LONG = 2002,
  VALUE_TOO_SHORT = 2003,
  INVALID_RANGE = 2004,
  INVALID_ENUM = 2005,
  PATTERN_MISMATCH = 2006,
  DUPLICATE_VALUE = 2007,
  INVALID_REFERENCE = 2008,
  SCHEMA_VIOLATION = 2009,
  
  // 状态错误 (2100-2199)
  INVALID_STATE_TRANSITION = 2100,
  STATE_CONFLICT = 2101,
  CONCURRENT_MODIFICATION = 2102,
  STATE_LOCKED = 2103,
  RESOURCE_BUSY = 2104,
  PRECONDITION_FAILED = 2105,
  POSTCONDITION_FAILED = 2106,
  DEADLOCK_DETECTED = 2107,
  ROLLBACK_FAILED = 2108,
  CHECKPOINT_FAILED = 2109,
  
  // AI服务错误 (3000-3999)
  API_KEY_INVALID = 3000,
  API_KEY_EXPIRED = 3001,
  AI_QUOTA_EXCEEDED = 3002,
  RATE_LIMIT_EXCEEDED = 3003,
  MODEL_NOT_AVAILABLE = 3004,
  SERVICE_UNAVAILABLE = 3005,
  INVALID_PARAMETERS = 3006,
  CONTENT_FILTERED = 3007,
  TOKEN_LIMIT_EXCEEDED = 3008,
  REGION_NOT_SUPPORTED = 3009,
  
  // DeepSeek特定错误 (3010-3019)
  DEEPSEEK_REASONING_FAILED = 3010,
  DEEPSEEK_CACHE_ERROR = 3011,
  DEEPSEEK_COMPATIBILITY_ERROR = 3012,
  DEEPSEEK_TOKEN_CALC_ERROR = 3013,
  
  // Gemini特定错误 (3020-3029)
  GEMINI_SAFETY_FILTERED = 3020,
  GEMINI_MULTIMODAL_ERROR = 3021,
  GEMINI_LIVE_API_ERROR = 3022,
  GEMINI_OAUTH_ERROR = 3023,
  GEMINI_CONTEXT_CACHE_ERROR = 3024,
  
  // SiliconFlow特定错误 (3030-3039)
  SILICONFLOW_BALANCE_INSUFFICIENT = 3030,
  SILICONFLOW_BATCH_ERROR = 3031,
  SILICONFLOW_MODEL_SWITCH_ERROR = 3032,
  SILICONFLOW_VOICE_ERROR = 3033,
  SILICONFLOW_SERVICE_TYPE_ERROR = 3034,
  
  // AI响应解析错误 (3200-3299)
  INVALID_JSON = 3200,
  MISSING_REQUIRED_FIELD = 3201,
  FIELD_TYPE_MISMATCH = 3202,
  FIELD_VALUE_INVALID = 3203,
  STRUCTURE_INVALID = 3204,
  ENCODING_ERROR = 3205,
  CONTENT_TRUNCATED = 3206,
  LANGUAGE_DETECTION_FAILED = 3207,
  SYNONYM_MAPPING_FAILED = 3208,
  FALLBACK_PARSE_FAILED = 3209,
  
  // 配置错误 (4000-4999)
  CONFIG_ERROR = 4000,
  INVALID_CONFIG_FORMAT = 4001,
  CONFIG_NOT_FOUND = 4002,
  CONFIG_VALIDATION_FAILED = 4003,
  INCOMPATIBLE_CONFIG_VERSION = 4004,
  
  // UI错误 (4000-4099)
  COMPONENT_MOUNT_FAILED = 4010,
  COMPONENT_UPDATE_FAILED = 4011,
  TEMPLATE_COMPILE_FAILED = 4012,
  STYLE_LOAD_FAILED = 4013,
  RESOURCE_LOAD_FAILED = 4014,
  ANIMATION_FAILED = 4015,
  LAYOUT_CALCULATION_FAILED = 4016,
  EVENT_BINDING_FAILED = 4017,
  MEMORY_LEAK_DETECTED = 4018,
  PERFORMANCE_DEGRADED = 4019,
  
  // 游戏逻辑错误 (6000-6999)
  GAME_ERROR = 6000,
  INVALID_GAME_STATE = 6001,
  GAME_NOT_INITIALIZED = 6002,
  INVALID_USER_INPUT = 6003,
  GAME_ALREADY_ENDED = 6004
}

// ============== 基础错误接口 ==============
export interface BaseError {
  code: ErrorCode
  message: string
  severity: ErrorSeverity
  category: ErrorCategory
  retryable: boolean
  timestamp: number
}

// ============== 处理后的错误 ==============
export interface ProcessedError extends BaseError {
  details?: string
  recovery: RecoveryStrategy
  userMessage: string
  context?: ErrorContext
  stack?: string
}

// ============== 错误上下文 ==============
export interface ErrorContext {
  module?: string
  function?: string
  gameRound?: number
  userId?: string
  requestId?: string
  additionalData?: Record<string, unknown>
}

// ============== 网络错误 ==============
export interface NetworkError extends BaseError {
  severity: ErrorSeverity.HIGH
  retryable: boolean
  maxRetries: number
  backoffStrategy: RetryStrategy
  timeout: number
}

// ============== 存储错误 ==============
export interface StorageError extends BaseError {
  severity: ErrorSeverity.HIGH | ErrorSeverity.MEDIUM
  retryable: boolean
  affectedData?: string[]
  recoverySuggestion: string
}

// ============== 验证错误 ==============
export interface ValidationError extends BaseError {
  severity: ErrorSeverity.LOW
  field: string
  value: unknown
  constraint: string
  retryable: false
}

// ============== 状态错误 ==============
export interface StateError extends BaseError {
  severity: ErrorSeverity.MEDIUM
  currentState: string
  attemptedState: string
  retryable: boolean
  retryDelay?: number
}

// ============== AI调用错误 ==============
export interface AICallError extends BaseError {
  provider: AIProvider
  model: string
  requestId?: string
  retryable: boolean
  retryAfter?: number
  
  // 服务商特定信息
  providerSpecific?: {
    // DeepSeek特定信息
    deepseek?: {
      cacheHitRate?: number
      reasoningTokens?: number
      compatibilityMode?: string
    }
    
    // Gemini特定信息
    gemini?: {
      safetyRatings?: SafetyRating[]
      blockReason?: string
      finishReason?: string
      candidateCount?: number
    }
    
    // SiliconFlow特定信息
    siliconflow?: {
      currentBalance?: string
      availableModels?: string[]
      serviceType?: string
      batchId?: string
      costEstimate?: string
    }
  }
}

// ============== 安全评级 ==============
export interface SafetyRating {
  category: string
  probability: string
  blocked: boolean
}

// ============== AI解析错误 ==============
export interface AIParseError extends BaseError {
  severity: ErrorSeverity.MEDIUM
  rawResponse: string
  parseStage: ParseStage
  expectedFormat: string
  retryable: true
  fallbackAvailable: boolean
}

// ============== 渲染错误 ==============
export interface RenderError extends BaseError {
  severity: ErrorSeverity.MEDIUM
  component: string
  element?: string
  retryable: boolean
  userVisible: boolean
}

// ============== 重试配置 ==============
export interface RetryConfig {
  strategy: RetryStrategy
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  multiplier?: number
  jitter?: boolean
  retryCondition?: (error: BaseError) => boolean
  fallbackHandler?: FallbackHandler
}

// ============== 降级处理器 ==============
export interface FallbackHandler {
  canHandle: (error: BaseError) => boolean
  handle: (error: BaseError, context: unknown) => Promise<unknown>
  priority: number
}

// ============== 重试历史 ==============
export interface RetryAttempt {
  attempt: number
  timestamp: number
  error: BaseError
  delay: number
  success: boolean
}

// ============== 熔断器配置 ==============
export interface CircuitBreakerConfig {
  failureThreshold: number
  timeout: number
  monitoringPeriod: number
  resetTimeout: number
  halfOpenMaxCalls: number
}

// ============== 熔断器接口 ==============
export interface CircuitBreaker {
  state: CircuitBreakerState
  failureCount: number
  successCount: number
  lastFailureTime?: number
  config: CircuitBreakerConfig
}

// ============== 错误处理结果 ==============
export interface ErrorHandleResult {
  handled: boolean
  recovery: RecoveryAction
  userNotification?: UserNotification
  logLevel: LogLevel
}

// ============== 恢复动作 ==============
export interface RecoveryAction {
  type: RecoveryStrategy
  params?: Record<string, unknown>
  delay?: number
  maxAttempts?: number
}

// ============== 用户通知 ==============
export interface UserNotification {
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
}

// ============== 通知动作 ==============
export interface NotificationAction {
  label: string
  action: () => void
  primary?: boolean
}

// ============== 错误统计 ==============
export interface ErrorMetrics {
  totalErrors: number
  errorsByCode: Record<number, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  errorsByModule: Record<string, number>
  errorRate: number
  recentErrors: ErrorOccurrence[]
  errorTrends: TrendData[]
  retryRate: number
  avgRetryAttempts: number
  retrySuccessRate: number
  recoveryTime: TimeMetrics
  fallbackUsage: number
}

// ============== 错误发生记录 ==============
export interface ErrorOccurrence {
  timestamp: number
  error: BaseError
  context: ErrorContext
  resolved: boolean
  resolutionTime?: number
}

// ============== 趋势数据 ==============
export interface TrendData {
  timestamp: number
  value: number
  label?: string
}

// ============== 时间指标 ==============
export interface TimeMetrics {
  min: number
  max: number
  avg: number
  p95: number
  p99: number
}

// ============== 约束检查结果 ==============
export interface ConstraintCheckResult {
  passed: boolean
  violations: ConstraintViolation[]
}

// ============== 约束违规 ==============
export interface ConstraintViolation {
  field: string
  constraint: string
  violatedValue: unknown
  message: string
}

// ============== 验证结果 ==============
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  sanitized?: unknown
}

// ============== 降级结果 ==============
export interface FallbackResult {
  success: boolean
  data?: unknown
  partial: boolean
}

// ============== 恢复计划 ==============
export interface RecoveryPlan {
  strategy: RecoveryStrategy
  actions: RecoveryActionDetail[]
  timeoutMs: number
  fallbackChain?: FallbackHandler[]
}

// ============== 恢复动作详情 ==============
export interface RecoveryActionDetail {
  type: 'cleanup' | 'rollback' | 'notify' | 'log' | 'metric'
  handler: (error: BaseError, context: unknown) => Promise<void>
  critical: boolean
}

// ============== 恢复结果 ==============
export interface RecoveryResult {
  success: boolean
  message: string
  newState?: unknown
  nextAction?: string
}

// ============== 恢复记录 ==============
export interface RecoveryRecord {
  timestamp: number
  errorCode: ErrorCode
  strategy: RecoveryStrategy
  success: boolean
  duration: number
  details?: string
}