import { AIProvider, ErrorCategory, ErrorSeverity, RecoveryStrategy } from '@/types/enums'
import { ErrorCode } from '@/types/error'
import { BaseErrorProcessor, type ErrorMetadata, type ErrorProcessorOptions } from './BaseErrorProcessor'

type DeepSeekErrorCode =
  | 'invalid_api_key'
  | 'rate_limit_exceeded'
  | 'kv_cache_error'
  | 'reasoning_mode_failed'
  | 'compatibility_error'
  | 'token_calculation_error'

interface DeepSeekErrorInfo {
  code: DeepSeekErrorCode | string
  message?: string
  status?: number
  type?: string
  requestId?: string
  retryAfter?: number
  raw?: unknown
}

const DEEPSEEK_ERROR_CODE_MAP: Record<
  DeepSeekErrorCode,
  {
    code: ErrorCode
    severity: ErrorSeverity
    retryable: boolean
    recovery: RecoveryStrategy
    userMessage: string
  }
> = {
  invalid_api_key: {
    code: ErrorCode.DEEPSEEK_INVALID_API_KEY,
    severity: ErrorSeverity.HIGH,
    retryable: false,
    recovery: RecoveryStrategy.USER_ACTION,
    userMessage: 'DeepSeek API 密钥无效，请在设置中重新配置。'
  },
  rate_limit_exceeded: {
    code: ErrorCode.DEEPSEEK_RATE_LIMIT_EXCEEDED,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    recovery: RecoveryStrategy.RETRY,
    userMessage: 'DeepSeek 请求频率达到上限，已安排自动重试。'
  },
  kv_cache_error: {
    code: ErrorCode.DEEPSEEK_CACHE_ERROR,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    recovery: RecoveryStrategy.FALLBACK,
    userMessage: 'DeepSeek KV 缓存暂不可用，系统已降级为实时计算模式。'
  },
  reasoning_mode_failed: {
    code: ErrorCode.DEEPSEEK_REASONING_FAILED,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    recovery: RecoveryStrategy.FALLBACK,
    userMessage: 'DeepSeek 推理模式失败，已切换至标准对话模式。'
  },
  compatibility_error: {
    code: ErrorCode.DEEPSEEK_COMPATIBILITY_ERROR,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    recovery: RecoveryStrategy.FALLBACK,
    userMessage: '当前兼容模式不受支持，系统已自动切换为默认模式。'
  },
  token_calculation_error: {
    code: ErrorCode.DEEPSEEK_TOKEN_CALC_ERROR,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    recovery: RecoveryStrategy.RETRY,
    userMessage: 'Token 计算出现异常，已重新安排请求。'
  }
}

export interface DeepSeekErrorProcessorOptions extends Omit<ErrorProcessorOptions, 'provider'> {}

/**
 * DeepSeek 服务专用的错误处理器。
 * 负责解析官方返回的错误结构并转换为统一的业务错误。
 */
export class DeepSeekErrorProcessor extends BaseErrorProcessor {
  constructor(options: DeepSeekErrorProcessorOptions = {}) {
    super({
      provider: AIProvider.DEEPSEEK,
      defaultCategory: ErrorCategory.AI_SERVICE,
      defaultSeverity: ErrorSeverity.HIGH,
      ...options
    })
  }

  protected override getProviderErrorCode(error: unknown, metadata: ErrorMetadata): ErrorCode | null {
    const info = this.extractErrorInfo(error)
    if (!info) {
      return null
    }

    const normalizedCode = this.normalizeErrorCode(info)
    const mapping = normalizedCode ? DEEPSEEK_ERROR_CODE_MAP[normalizedCode] : undefined

    if (mapping) {
      this.applyMetadata(metadata, info, mapping)
      return mapping.code
    }

    if (info.status === 401 || info.status === 403) {
      this.applyMetadata(metadata, info, DEEPSEEK_ERROR_CODE_MAP.invalid_api_key)
      return ErrorCode.DEEPSEEK_INVALID_API_KEY
    }

    if (info.status === 429) {
      this.applyMetadata(metadata, info, DEEPSEEK_ERROR_CODE_MAP.rate_limit_exceeded)
      if (info.retryAfter !== undefined) {
        metadata.context = this.mergeContext(metadata, {
          retryAfterSeconds: info.retryAfter
        })
      }
      return ErrorCode.DEEPSEEK_RATE_LIMIT_EXCEEDED
    }

    if (info.message) {
      const message = info.message.toLowerCase()

      if (message.includes('kv cache')) {
        this.applyMetadata(metadata, info, DEEPSEEK_ERROR_CODE_MAP.kv_cache_error)
        return ErrorCode.DEEPSEEK_CACHE_ERROR
      }

      if (message.includes('reasoning')) {
        this.applyMetadata(metadata, info, DEEPSEEK_ERROR_CODE_MAP.reasoning_mode_failed)
        return ErrorCode.DEEPSEEK_REASONING_FAILED
      }

      if (message.includes('compatibility') || message.includes('兼容')) {
        this.applyMetadata(metadata, info, DEEPSEEK_ERROR_CODE_MAP.compatibility_error)
        return ErrorCode.DEEPSEEK_COMPATIBILITY_ERROR
      }

      if (message.includes('token') || message.includes('计数') || message.includes('计算')) {
        this.applyMetadata(metadata, info, DEEPSEEK_ERROR_CODE_MAP.token_calculation_error)
        return ErrorCode.DEEPSEEK_TOKEN_CALC_ERROR
      }
    }

    metadata.details = metadata.details ?? this.serializeDetails(info)
    metadata.userMessage = metadata.userMessage ?? info.message ?? 'DeepSeek 服务返回未知错误'
    metadata.category = metadata.category ?? ErrorCategory.AI_SERVICE

    return null
  }

  private extractErrorInfo(error: unknown): DeepSeekErrorInfo | null {
    if (!error) {
      return null
    }

    if (this.isDeepSeekErrorEnvelope(error)) {
      return {
        code: error.error?.code ?? '',
        message: error.error?.message,
        status: this.toInteger(error.error?.status ?? error.status),
        type: typeof error.error?.type === 'string' ? error.error.type : undefined,
        requestId: this.extractRequestId(error),
        retryAfter: this.toInteger(error.error?.retry_after ?? error.retry_after ?? error.headers?.['retry-after']),
        raw: error
      }
    }

    if (this.isDeepSeekErrorObject(error)) {
      return {
        code: error.code ?? '',
        message: error.message,
        status: this.toInteger(error.status),
        type: typeof error.type === 'string' ? error.type : undefined,
        requestId: this.extractRequestId(error),
        retryAfter: this.toInteger(error.retry_after ?? error.retryAfter),
        raw: error
      }
    }

    if (error instanceof Error) {
      return {
        code: '',
        message: error.message,
        raw: error
      }
    }

    if (typeof error === 'string') {
      return {
        code: '',
        message: error,
        raw: error
      }
    }

    return null
  }

  private normalizeErrorCode(info: DeepSeekErrorInfo): DeepSeekErrorCode | undefined {
    const code = typeof info.code === 'string' ? info.code.trim().toLowerCase() : ''
    switch (code) {
      case 'invalid_api_key':
      case 'invalid_authentication':
        return 'invalid_api_key'
      case 'rate_limit_exceeded':
      case 'requests_exceeded':
        return 'rate_limit_exceeded'
      case 'kv_cache_error':
      case 'cache_error':
      case 'kv_cache_failed':
        return 'kv_cache_error'
      case 'reasoning_mode_failed':
      case 'reasoning_failed':
      case 'reasoning_unavailable':
        return 'reasoning_mode_failed'
      case 'compatibility_error':
      case 'compatibility_mode_failed':
      case 'compatibility_mode_error':
        return 'compatibility_error'
      case 'token_calculation_error':
      case 'token_calc_error':
      case 'token_count_failed':
        return 'token_calculation_error'
      default:
        return undefined
    }
  }

  private applyMetadata(
    metadata: ErrorMetadata,
    info: DeepSeekErrorInfo,
    mapping: (typeof DEEPSEEK_ERROR_CODE_MAP)[DeepSeekErrorCode]
  ): void {
    metadata.userMessage = metadata.userMessage ?? mapping.userMessage
    metadata.details = metadata.details ?? this.serializeDetails(info, mapping.code)
    metadata.category = metadata.category ?? ErrorCategory.AI_SERVICE
    metadata.severity = metadata.severity ?? mapping.severity
    metadata.retryable = metadata.retryable ?? mapping.retryable
    metadata.recoveryStrategy = metadata.recoveryStrategy ?? mapping.recovery
    metadata.context = this.mergeContext(metadata, {
      providerCode: info.code,
      providerType: info.type,
      providerStatus: info.status,
      providerRequestId: info.requestId,
      retryAfterSeconds: info.retryAfter
    })
  }

  private mergeContext(metadata: ErrorMetadata, extras: Record<string, unknown | undefined>) {
    const current = metadata.context ?? {}
    const additionalData = {
      ...(current.additionalData ?? {}),
      ...Object.fromEntries(
        Object.entries(extras).filter(([, value]) => value !== undefined)
      )
    }

    return {
      ...current,
      additionalData: Object.keys(additionalData).length ? additionalData : current.additionalData
    }
  }

  private serializeDetails(info: DeepSeekErrorInfo, mappedCode?: ErrorCode): string {
    const parts: string[] = []
    if (info.code) {
      parts.push(`providerCode=${info.code}`)
    }
    if (mappedCode !== undefined) {
      parts.push(`mappedCode=${mappedCode}`)
    }
    if (info.status !== undefined) {
      parts.push(`status=${info.status}`)
    }
    if (info.type) {
      parts.push(`type=${info.type}`)
    }
    if (info.requestId) {
      parts.push(`requestId=${info.requestId}`)
    }

    if (!parts.length && info.message) {
      parts.push(info.message)
    }

    return parts.join(' | ')
  }

  private extractRequestId(error: Record<string, unknown>): string | undefined {
    const requestId = error.request_id ?? error.requestId ?? error['x-request-id']
    return typeof requestId === 'string' ? requestId : undefined
  }

  private isDeepSeekErrorEnvelope(value: unknown): value is {
    error?: {
      code?: string
      message?: string
      status?: number | string
      type?: string
      retry_after?: number | string
    }
    status?: number | string
    retry_after?: number | string
    headers?: Record<string, unknown>
    request_id?: string
  } {
    return (
      typeof value === 'object' &&
      value !== null &&
      ('error' in value ||
        'status' in value ||
        'retry_after' in value ||
        'headers' in value ||
        'request_id' in value)
    )
  }

  private isDeepSeekErrorObject(value: unknown): value is {
    code?: string
    message?: string
    status?: number | string
    type?: string
    retry_after?: number | string
    retryAfter?: number | string
    request_id?: string
    requestId?: string
  } {
    return typeof value === 'object' && value !== null && ('code' in value || 'message' in value)
  }

  private toInteger(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string') {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : undefined
    }
    return undefined
  }
}
