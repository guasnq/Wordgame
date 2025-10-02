import type { AIServiceAdapter, AIConfig, AIRequest, AIResponse, ConnectionTestResult, UsageStats, AdapterTelemetrySnapshot } from '@/types/ai'
import { ConnectionStatus } from '@/types/ai'
import { AIProvider, GameEvent } from '@/types/enums'
import type { EventBusAPI } from '@/types/interfaces'
import { BaseConnectionManager } from '../connection/BaseConnectionManager'
import { BaseRequestHandler, type RequestExecutionResult } from '../request/BaseRequestHandler'
import { BaseErrorProcessor, type AdapterProcessedError, type ErrorMetadata } from '../errors/BaseErrorProcessor'
import type { AIAdapterLogger } from './types'

export interface BaseAIServiceAdapterOptions {
  logger?: AIAdapterLogger
  eventBus?: EventBusAPI
  autoReconnect?: boolean
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

    this.emitEvent(GameEvent.AI_REQUEST_STARTED, {
      provider: this.provider,
      requestId: request.id
    })

    try {
      const result = await this.requestHandler.execute({ request, config: this.config! })
      this.recordRequestSuccess(request, result)

      this.emitEvent(GameEvent.AI_REQUEST_COMPLETED, {
        provider: this.provider,
        requestId: request.id,
        latency: result.latency
      })

      return result.response
    } catch (error) {
      const processed = this.errorProcessor.process(error, this.buildErrorMetadata('send_request', request))
      this.recordRequestFailure(request, processed)

      this.emitEvent(GameEvent.AI_REQUEST_FAILED, {
        provider: this.provider,
        requestId: request.id,
        error: processed
      })

      throw processed
    }
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
