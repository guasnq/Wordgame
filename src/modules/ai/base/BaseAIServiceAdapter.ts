import type {
  AIServiceAdapter,
  AIConfig,
  AIRequest,
  AIResponse,
  ConnectionTestResult,
  UsageStats,
  AdapterTelemetrySnapshot
} from '@/types/ai'
import { ConnectionStatus } from '@/types/ai'
import { AIProvider, GameEvent, RetryStrategy } from '@/types/enums'
import type { EventBusAPI } from '@/types/interfaces'
import { BaseConnectionManager } from '../connection/BaseConnectionManager'
import { BaseRequestHandler, type RequestExecutionResult } from '../request/BaseRequestHandler'
import { BaseErrorProcessor, type AdapterProcessedError, type ErrorMetadata } from '../errors/BaseErrorProcessor'
import type { AIAdapterLogger } from './types'
import { DEFAULT_CONFIG } from '@/constants'


export interface BaseAIServiceAdapterOptions {
  logger?: AIAdapterLogger
  eventBus?: EventBusAPI
  autoReconnect?: boolean
}

interface AdapterRetryPolicy {
  maxRetries: number
  strategy: RetryStrategy
  baseDelay: number
  maxDelay: number
  multiplier: number
  jitter: boolean
}

/**
 * AI服务适配器基础实现
 * 负责协调连接管理、请求执行与错误处理
 */
export abstract class BaseAIServiceAdapter implements AIServiceAdapter {
  protected readonly logger?: AIAdapterLogger
  protected readonly eventBus?: EventBusAPI
  protected readonly autoReconnect: boolean

  protected readonly connectionManager: BaseConnectionManager
  protected readonly requestHandler: BaseRequestHandler
  protected readonly errorProcessor: BaseErrorProcessor

  protected usageStats: UsageStats = this.createInitialUsageStats()
  protected config?: AIConfig
  protected initialized = false

  private lastConnectionTest?: ConnectionTestResult

  private readonly statusListener = (status: ConnectionStatus) => {
    this.onConnectionStatusChange(status)
    this.eventBus?.emit('ai:connection_status', {
      provider: this.provider,
      status
    })
  }

  protected constructor(
    protected readonly provider: AIProvider,
    options: BaseAIServiceAdapterOptions = {}
  ) {
    this.logger = options.logger
    this.eventBus = options.eventBus
    this.autoReconnect = options.autoReconnect ?? true

    this.connectionManager = this.createConnectionManager()
    this.requestHandler = this.createRequestHandler()
    this.errorProcessor = this.createErrorProcessor()

    this.connectionManager.addStatusListener(this.statusListener)
  }

  async initialize(config: AIConfig): Promise<void> {
    const normalizedConfig = this.sanitizeConfig(config)
    this.validateConfig(normalizedConfig)

    try {
      await this.connectionManager.connect(normalizedConfig.connection)
      this.config = normalizedConfig
      this.initialized = true
      this.resetUsageStats()
    } catch (error) {
      this.initialized = false
      throw error
    }
  }

  async disconnect(): Promise<void> {
    await this.connectionManager.disconnect()
    this.initialized = false
  }

 async sendRequest(request: AIRequest): Promise<AIResponse> {
    this.ensureInitialized()
    await this.ensureConnection()

    this.usageStats.totalRequests += 1
    this.usageStats.lastRequestTime = Date.now()

    const policy = this.resolveRetryPolicy(request)

    this.emitEvent(GameEvent.AI_REQUEST_STARTED, {
      provider: this.provider,
      requestId: request.id
    })

    for (let attempt = 0; attempt <= policy.maxRetries; attempt += 1) {
      try {
        const result = await this.requestHandler.execute({ request, config: this.config! })
        this.recordRequestSuccess(request, result)

        this.emitEvent(GameEvent.AI_REQUEST_COMPLETED, {
          provider: this.provider,
          requestId: request.id,
          latency: result.latency,
          attempt
        })

        return result.response
      } catch (error) {
        const metadata = this.buildAttemptMetadata(request, attempt, policy)
        const processed = this.errorProcessor.process(error, metadata)

        if (!this.shouldRetry(processed, attempt, policy)) {
          this.recordRequestFailure(request, processed)

          this.emitEvent(GameEvent.AI_REQUEST_FAILED, {
            provider: this.provider,
            requestId: request.id,
            error: processed,
            attempt
          })

          throw processed
        }

        const nextAttempt = attempt + 1
        const delay = this.calculateRetryDelay(policy, nextAttempt, processed)

        this.logger?.warn('AI请求失败，准备重试', {
          provider: this.provider,
          requestId: request.id,
          attempt: nextAttempt,
          maxRetries: policy.maxRetries,
          code: processed.code,
          retryDelay: delay
        })

        if (delay > 0) {
          await this.wait(delay)
        }
      }
    }

    throw new Error('未能完成AI请求且未捕获失败事件')
  }
  async testConnection(): Promise<ConnectionTestResult> {
    this.ensureInitialized()
    const result = await this.connectionManager.testConnection(this.config?.connection)
    this.lastConnectionTest = result
    return result
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionManager.getStatus()
  }

  getUsageStats(): UsageStats {
    return { ...this.usageStats }
  }

  getTelemetry(): AdapterTelemetrySnapshot {
    return {
      usage: { ...this.usageStats },
      connection: {
        status: this.connectionManager.getStatus(),
        metrics: this.connectionManager.getMetrics(),
        lastTestResult: this.lastConnectionTest
      }
    }
  }

  handleError(error: Error): AdapterProcessedError {
    return this.errorProcessor.process(error, this.buildErrorMetadata('manual_handle'))
  }

  protected async ensureConnection(): Promise<void> {
    const status = this.connectionManager.getStatus()
    if (status === ConnectionStatus.CONNECTED) {
      return
    }

    if (!this.config) {
      throw new Error('缺少AI服务连接配置')
    }

    if (!this.autoReconnect && status !== ConnectionStatus.CONNECTING) {
      throw new Error('AI服务当前不可用且未启用自动重连')
    }

    if (status === ConnectionStatus.CONNECTING) {
      return
    }

    await this.connectionManager.connect(this.config.connection)
  }

  protected recordRequestSuccess(request: AIRequest, result: RequestExecutionResult): void {
    this.usageStats.successfulRequests += 1

    const successCount = this.usageStats.successfulRequests
    if (successCount === 1) {
      this.usageStats.averageResponseTime = result.latency
    } else {
      const previousAverage = this.usageStats.averageResponseTime
      this.usageStats.averageResponseTime = previousAverage + (result.latency - previousAverage) / successCount
    }

    const tokenUsage = result.tokenUsage ?? result.response.metadata?.tokenUsage
    if (tokenUsage) {
      this.usageStats.totalTokensUsed += tokenUsage.totalTokens
    }

    this.updateErrorRate()
    this.onRequestSuccess(request, result)
  }

 protected recordRequestFailure(request: AIRequest, error: AdapterProcessedError): void {
    this.usageStats.failedRequests += 1
    this.updateErrorRate()
    this.onRequestFailure(request, error)
  }

  private buildAttemptMetadata(request: AIRequest, attempt: number, policy: AdapterRetryPolicy): ErrorMetadata {
    const metadata = this.buildErrorMetadata('send_request', request)
    const attemptNumber = attempt + 1
    metadata.stage = attempt === 0 ? 'send_request' : `send_request_retry_${attemptNumber}`

    const baseContext = metadata.context ?? {}
    const mergedAdditionalData = {
      ...(baseContext.additionalData ?? {}),
      attempt: attemptNumber,
      maxRetries: policy.maxRetries,
      retryStrategy: policy.strategy
    }

    metadata.context = {
      ...baseContext,
      additionalData: mergedAdditionalData
    }

    return metadata
  }

  private resolveRetryPolicy(request: AIRequest): AdapterRetryPolicy {
    const connection = this.config?.connection
    const configRetries = typeof connection?.maxRetries === 'number' ? Math.max(0, Math.floor(connection.maxRetries)) : 0
    const requestRetries = typeof request.config.retryAttempts === 'number' ? Math.max(0, Math.floor(request.config.retryAttempts)) : 0
    const maxRetries = Math.max(configRetries, requestRetries)

    const configuredDelay = typeof connection?.retryDelay === 'number' && Number.isFinite(connection.retryDelay) ? Math.max(0, connection.retryDelay) : undefined
    const baseDelay = Math.max(100, Math.min(configuredDelay ?? 500, 10000))
    const maxDelay = Math.max(baseDelay * 4, baseDelay + 1000)
    const multiplier = 2

    const strategy = this.normalizeRetryStrategy(DEFAULT_CONFIG.error?.defaultRetryStrategy)

    return {
      maxRetries,
      strategy,
      baseDelay,
      maxDelay,
      multiplier,
      jitter: strategy === RetryStrategy.EXPONENTIAL
    }
  }

  private normalizeRetryStrategy(value?: string): RetryStrategy {
    if (!value) {
      return RetryStrategy.EXPONENTIAL
    }

    const normalized = value.toLowerCase()

    switch (normalized) {
      case 'none':
        return RetryStrategy.NONE
      case 'immediate':
        return RetryStrategy.IMMEDIATE
      case 'fixed_delay':
      case 'fixed':
        return RetryStrategy.FIXED_DELAY
      case 'linear':
        return RetryStrategy.LINEAR
      case 'custom':
        return RetryStrategy.CUSTOM
      default:
        return RetryStrategy.EXPONENTIAL
    }
  }

  private shouldRetry(error: AdapterProcessedError, attempt: number, policy: AdapterRetryPolicy): boolean {
    if (!error.retryable) {
      return false
    }

    if (policy.maxRetries === 0) {
      return false
    }

    return attempt < policy.maxRetries
  }

  private calculateRetryDelay(policy: AdapterRetryPolicy, attempt: number, error: AdapterProcessedError): number {
    const retryAfterSeconds = this.extractRetryAfterSeconds(error)
    if (retryAfterSeconds !== undefined && retryAfterSeconds >= 0) {
      return Math.min(policy.maxDelay, Math.round(retryAfterSeconds * 1000))
    }

    const attemptIndex = Math.max(1, attempt)

    let delay: number
    switch (policy.strategy) {
      case RetryStrategy.NONE:
      case RetryStrategy.IMMEDIATE:
        delay = 0
        break
      case RetryStrategy.FIXED_DELAY:
        delay = policy.baseDelay
        break
      case RetryStrategy.LINEAR:
        delay = policy.baseDelay * attemptIndex
        break
      case RetryStrategy.CUSTOM:
        delay = policy.baseDelay * attemptIndex
        break
      case RetryStrategy.EXPONENTIAL:
      default:
        delay = policy.baseDelay * Math.pow(policy.multiplier, attemptIndex - 1)
        break
    }

    if (!Number.isFinite(delay)) {
      delay = policy.baseDelay
    }

    delay = Math.min(delay, policy.maxDelay)

    if (policy.jitter && delay > 0) {
      const deterministicSeed = (attemptIndex * 37) % 10
      const jitterRatio = (deterministicSeed - 5) / 50
      delay = Math.max(0, Math.round(delay * (1 + jitterRatio)))
    }

    return Math.max(0, Math.round(delay))
  }

  private extractRetryAfterSeconds(error: AdapterProcessedError): number | undefined {
    const additional = error.context?.additionalData
    if (!additional || typeof additional !== 'object') {
      return undefined
    }

    const candidate = (additional as Record<string, unknown>).retryAfterSeconds
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate
    }

    if (typeof candidate === 'string') {
      const parsed = Number(candidate)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }

    return undefined
  }

  private wait(duration: number): Promise<void> {
    if (duration <= 0) {
      return Promise.resolve()
    }

    return new Promise(resolve => setTimeout(resolve, duration))
  }
  protected updateErrorRate(): void {
    if (this.usageStats.totalRequests === 0) {
      this.usageStats.errorRate = 0
      return
    }

    this.usageStats.errorRate = this.usageStats.failedRequests / this.usageStats.totalRequests
  }

  protected ensureInitialized(): void {
    if (!this.initialized || !this.config) {
      throw new Error('AI服务适配器尚未初始化')
    }
  }

  protected resetUsageStats(): void {
    this.usageStats = this.createInitialUsageStats()
  }

  protected createInitialUsageStats(): UsageStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      averageResponseTime: 0,
      errorRate: 0
    }
  }

  protected buildErrorMetadata(stage: string, request?: AIRequest): ErrorMetadata {
    return {
      stage,
      requestId: request?.id,
      context: {
        module: 'ai-adapter',
        function: stage,
        requestId: request?.id,
        additionalData: request ? { provider: this.provider } : undefined
      }
    }
  }

  protected onConnectionStatusChange(status: ConnectionStatus): void {
    this.logger?.debug('AI连接状态变化', { provider: this.provider, status })
  }

  protected onRequestSuccess(request: AIRequest, result: RequestExecutionResult): void {
    this.logger?.info('AI请求成功', {
      provider: this.provider,
      requestId: request.id,
      latency: result.latency
    })
  }

  protected onRequestFailure(request: AIRequest, error: AdapterProcessedError): void {
    this.logger?.warn('AI请求失败', {
      provider: this.provider,
      requestId: request.id,
      code: error.code,
      retryable: error.retryable
    })
  }

  protected emitEvent<T>(event: GameEvent | string, payload: T): void {
    this.eventBus?.emit(event, payload)
  }

  protected sanitizeConfig(config: AIConfig): AIConfig {
    return config
  }

  protected validateConfig(config: AIConfig): void {
    if (!config.connection) {
      throw new Error('AI服务配置缺少connection字段')
    }
  }

  protected abstract createConnectionManager(): BaseConnectionManager
  protected abstract createRequestHandler(): BaseRequestHandler
  protected abstract createErrorProcessor(): BaseErrorProcessor
}








