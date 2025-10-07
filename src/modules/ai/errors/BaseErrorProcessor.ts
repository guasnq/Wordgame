import { AIProvider, ErrorCategory, ErrorSeverity, RecoveryStrategy } from '@/types/enums'
import { ErrorCode, type BaseError, type ErrorContext, type ProcessedError as CoreProcessedError } from '@/types/error'
import type { ProcessedError as AIProcessedError, RecoveryAction } from '@/types/ai'
import type { AIAdapterLogger } from '../base/types'

export type AdapterProcessedError = CoreProcessedError & AIProcessedError

export interface ErrorProcessorOptions {
  provider: AIProvider
  logger?: AIAdapterLogger
  defaultCategory?: ErrorCategory
  defaultSeverity?: ErrorSeverity
}

export interface ErrorMetadata {
  stage?: string
  requestId?: string
  context?: ErrorContext
  userMessage?: string
  recoveryStrategy?: RecoveryStrategy
  recoveryAction?: RecoveryAction
  category?: ErrorCategory
  severity?: ErrorSeverity
  details?: string
  retryable?: boolean
}

const RETRYABLE_ERROR_CODES = new Set<ErrorCode>([
  ErrorCode.CONNECTION_FAILED,
  ErrorCode.CONNECTION_TIMEOUT,
  ErrorCode.NETWORK_UNREACHABLE,
  ErrorCode.CONNECTION_RESET,
  ErrorCode.TOO_MANY_REQUESTS,
  ErrorCode.BANDWIDTH_EXCEEDED,
  ErrorCode.SERVICE_UNAVAILABLE,
  ErrorCode.RATE_LIMIT_EXCEEDED,
  ErrorCode.DEEPSEEK_RATE_LIMIT_EXCEEDED
])

/**
 * AI服务错误处理基类
 * 将原始错误归一化为统一结构，便于上层模块处理
 */
export abstract class BaseErrorProcessor {
  protected constructor(protected readonly options: ErrorProcessorOptions) {}

  process(error: unknown, metadata: ErrorMetadata = {}): AdapterProcessedError {
    const processed = this.normalizeError(error, metadata)

    if (this.options.logger) {
      this.options.logger.error(`[AI:${this.options.provider}] ${processed.message}`, {
        code: processed.code,
        requestId: metadata.requestId,
        stage: metadata.stage
      })
    }

    return processed
  }

  protected normalizeError(error: unknown, metadata: ErrorMetadata): AdapterProcessedError {
    if (this.isAdapterProcessedError(error)) {
      return this.mergeMetadata(error, metadata)
    }

    if (this.isBaseError(error)) {
      return this.fromBaseError(error, metadata)
    }

    return this.fromUnknownError(error, metadata)
  }

  protected mergeMetadata(error: AdapterProcessedError, metadata: ErrorMetadata): AdapterProcessedError {
    return {
      ...error,
      provider: error.provider ?? this.options.provider,
      recovery: metadata.recoveryStrategy ?? error.recovery,
      recoveryAction: metadata.recoveryAction ?? error.recoveryAction ?? this.toRecoveryAction(metadata.recoveryStrategy ?? error.recovery),
      userMessage: metadata.userMessage ?? error.userMessage ?? error.message,
      context: metadata.context ?? error.context ?? this.buildContext(metadata),
      details: metadata.details ?? error.details,
      severity: metadata.severity ?? error.severity ?? this.getDefaultSeverity(error.code),
      category: metadata.category ?? error.category ?? this.getDefaultCategory(error.code),
      retryable: metadata.retryable ?? error.retryable
    }
  }

  protected fromBaseError(error: BaseError, metadata: ErrorMetadata): AdapterProcessedError {
    const code = error.code ?? this.mapErrorCode(error, metadata)
    const severity = metadata.severity ?? error.severity ?? this.getDefaultSeverity(code)
    const category = metadata.category ?? error.category ?? this.getDefaultCategory(code)
    const retryable = metadata.retryable ?? error.retryable ?? this.isRetryable(code)
    const recoveryStrategy = metadata.recoveryStrategy ?? this.suggestRecoveryStrategy(code, retryable)
    const context = metadata.context ?? (error as CoreProcessedError).context ?? this.buildContext(metadata)

    return {
      ...error,
      code,
      severity,
      category,
      retryable,
      provider: this.options.provider,
      recovery: recoveryStrategy,
      recoveryAction: metadata.recoveryAction ?? this.toRecoveryAction(recoveryStrategy),
      userMessage: metadata.userMessage ?? error.message,
      context,
      details: metadata.details ?? (error as CoreProcessedError).details,
      stack: (error as CoreProcessedError).stack
    }
  }

  protected fromUnknownError(error: unknown, metadata: ErrorMetadata): AdapterProcessedError {
    const code = this.mapErrorCode(error, metadata)
    const severity = metadata.severity ?? this.getDefaultSeverity(code)
    const category = metadata.category ?? this.getDefaultCategory(code)
    const retryable = metadata.retryable ?? this.isRetryable(code)
    const recoveryStrategy = metadata.recoveryStrategy ?? this.suggestRecoveryStrategy(code, retryable)
    const context = metadata.context ?? this.buildContext(metadata)
    const message = error instanceof Error ? error.message : '未知错误'

    return {
      code,
      message,
      severity,
      category,
      retryable,
      timestamp: Date.now(),
      provider: this.options.provider,
      recovery: recoveryStrategy,
      recoveryAction: metadata.recoveryAction ?? this.toRecoveryAction(recoveryStrategy),
      userMessage: metadata.userMessage ?? message,
      context,
      details: metadata.details ?? this.extractDetails(error),
      stack: error instanceof Error ? error.stack : undefined
    }
  }

  protected buildContext(metadata: ErrorMetadata): ErrorContext | undefined {
    if (metadata.context) {
      return metadata.context
    }

    if (!metadata.stage && !metadata.requestId) {
      return undefined
    }

    return {
      ...(metadata.context ?? {}),
      function: metadata.stage,
      requestId: metadata.requestId
    }
  }

  protected extractDetails(error: unknown): string | undefined {
    if (error instanceof Error && error.stack) {
      return error.stack
    }

    if (typeof error === 'string') {
      return error
    }

    try {
      return JSON.stringify(error)
    } catch {
      return undefined
    }
  }

  protected isAdapterProcessedError(value: unknown): value is AdapterProcessedError {
    if (!value || typeof value !== 'object') {
      return false
    }

    return 'code' in value && 'provider' in value && 'recovery' in value
  }

  protected isBaseError(value: unknown): value is BaseError {
    if (!value || typeof value !== 'object') {
      return false
    }

    return 'code' in value && 'message' in value && 'timestamp' in value
  }

  protected toRecoveryAction(strategy: RecoveryStrategy): RecoveryAction {
    switch (strategy) {
      case RecoveryStrategy.RETRY:
        return { type: 'retry' }
      case RecoveryStrategy.FALLBACK:
        return { type: 'fallback' }
      case RecoveryStrategy.RESET:
        return { type: 'user_action', params: { action: 'reset' } }
      case RecoveryStrategy.USER_ACTION:
        return { type: 'user_action' }
      default:
        return { type: 'user_action' }
    }
  }

  protected getDefaultSeverity(code: ErrorCode): ErrorSeverity {
    if (code >= ErrorCode.API_KEY_INVALID && code < ErrorCode.INVALID_JSON) {
      return ErrorSeverity.HIGH
    }

    if (code >= ErrorCode.INVALID_JSON && code < ErrorCode.CONFIG_ERROR) {
      return ErrorSeverity.MEDIUM
    }

    if (code >= ErrorCode.CONFIG_ERROR) {
      return ErrorSeverity.MEDIUM
    }

    return this.options.defaultSeverity ?? ErrorSeverity.HIGH
  }

  protected getDefaultCategory(code: ErrorCode): ErrorCategory {
    if (code >= ErrorCode.CONNECTION_FAILED && code <= ErrorCode.FIREWALL_BLOCKED) {
      return ErrorCategory.NETWORK
    }

    if (code >= ErrorCode.API_KEY_INVALID && code < ErrorCode.INVALID_JSON) {
      return ErrorCategory.AI_SERVICE
    }

    if (code >= ErrorCode.INVALID_JSON && code < ErrorCode.CONFIG_ERROR) {
      return ErrorCategory.VALIDATION
    }

    if (code >= ErrorCode.CONFIG_ERROR && code < 5000) {
      return ErrorCategory.CONFIG
    }

    return this.options.defaultCategory ?? ErrorCategory.AI_SERVICE
  }

  protected isRetryable(code: ErrorCode): boolean {
    return RETRYABLE_ERROR_CODES.has(code)
  }

  protected suggestRecoveryStrategy(code: ErrorCode, retryable: boolean): RecoveryStrategy {
    if (retryable) {
      return RecoveryStrategy.RETRY
    }

    if (code === ErrorCode.DEEPSEEK_INVALID_API_KEY) {
      return RecoveryStrategy.USER_ACTION
    }

    if (code === ErrorCode.DEEPSEEK_CACHE_ERROR || code === ErrorCode.DEEPSEEK_REASONING_FAILED) {
      return RecoveryStrategy.FALLBACK
    }

    if (code === ErrorCode.DEEPSEEK_RATE_LIMIT_EXCEEDED) {
      return RecoveryStrategy.RETRY
    }

    if (code === ErrorCode.API_KEY_INVALID || code === ErrorCode.API_KEY_EXPIRED) {
      return RecoveryStrategy.USER_ACTION
    }

    if (code === ErrorCode.MODEL_NOT_AVAILABLE || code === ErrorCode.SERVICE_UNAVAILABLE) {
      return RecoveryStrategy.FALLBACK
    }

    return RecoveryStrategy.USER_ACTION
  }

  protected mapErrorCode(error: unknown, metadata: ErrorMetadata): ErrorCode {
    const providerSpecific = this.getProviderErrorCode(error, metadata)
    if (providerSpecific) {
      return providerSpecific
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      return ErrorCode.OPERATION_TIMEOUT
    }

    if (error instanceof TypeError) {
      return ErrorCode.INVALID_PARAMETERS
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase()

      if (message.includes('timeout')) {
        return ErrorCode.CONNECTION_TIMEOUT
      }

      if (message.includes('network') || message.includes('fetch')) {
        return ErrorCode.CONNECTION_FAILED
      }

      if (message.includes('unauthorized') || message.includes('api key')) {
        return ErrorCode.API_KEY_INVALID
      }

      if (message.includes('quota') || message.includes('rate limit')) {
        return ErrorCode.RATE_LIMIT_EXCEEDED
      }

      if (message.includes('invalid json') || message.includes('parse')) {
        return ErrorCode.INVALID_JSON
      }
    }

    return ErrorCode.UNKNOWN_ERROR
  }

  /**
   * 将服务商特定的错误对象或错误码映射为项目统一的 `ErrorCode`。
   * 未能识别时应返回 `null`，交由基类执行通用映射逻辑。
   */
  protected abstract getProviderErrorCode(error: unknown, metadata: ErrorMetadata): ErrorCode | null
}

