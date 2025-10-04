import { ConnectionStatus, type ConnectionConfig, type ConnectionTestResult, type ConnectionMetrics } from '@/types/ai'
import type { AIAdapterLogger } from '../base/types'

export interface ConnectionManagerOptions {
  logger?: AIAdapterLogger
  onStatusChange?: (status: ConnectionStatus) => void
}

/**
 * 连接管理基类
 * 负责跟踪连接状态、统计信息以及基础的连接生命周期
 */
export abstract class BaseConnectionManager<TConfig extends ConnectionConfig = ConnectionConfig> {
  private readonly statusListeners = new Set<(status: ConnectionStatus) => void>()
  protected status: ConnectionStatus = ConnectionStatus.DISCONNECTED
  protected currentConfig?: TConfig
  protected metrics: ConnectionMetrics = {
    status: ConnectionStatus.DISCONNECTED,
    totalAttempts: 0,
    successfulConnections: 0,
    consecutiveFailures: 0
  }
  protected lastError?: unknown

  constructor(protected readonly options: ConnectionManagerOptions = {}) {
    if (options.onStatusChange) {
      this.statusListeners.add(options.onStatusChange)
    }
  }

  async connect(config: TConfig): Promise<void> {
    this.validateConfig(config)
    this.currentConfig = config
    this.metrics.totalAttempts += 1
    this.setStatus(ConnectionStatus.CONNECTING)
    this.options.logger?.info('Connecting to AI服务', { endpoint: this.maskUrl(config.apiUrl) })

    try {
      const start = this.getTimestamp()
      await this.establishConnection(config)
      const latency = this.getTimestamp() - start
      this.recordSuccess(latency)
      this.setStatus(ConnectionStatus.CONNECTED)
    } catch (error) {
      this.recordFailure(error)
      this.setStatus(ConnectionStatus.ERROR)
      throw error
    }
  }

  async reconnect(): Promise<void> {
    if (!this.currentConfig) {
      throw new Error('无法重连：缺少连接配置')
    }

    await this.connect(this.currentConfig)
  }

  async disconnect(): Promise<void> {
    if (this.status === ConnectionStatus.DISCONNECTED) {
      return
    }

    this.options.logger?.info('Disconnecting from AI服务')
    try {
      await this.terminateConnection()
    } finally {
      this.metrics.lastDisconnectedAt = Date.now()
      this.setStatus(ConnectionStatus.DISCONNECTED)
    }
  }

  async testConnection(config?: TConfig): Promise<ConnectionTestResult> {
    const targetConfig = config ?? this.currentConfig
    if (!targetConfig) {
      throw new Error('测试连接需要提供连接配置')
    }

    const start = this.getTimestamp()
    try {
      const result = await this.performConnectionTest(targetConfig)
      const latency = result.responseTime ?? this.getTimestamp() - start
      this.updateLatency(latency)

      return {
        success: result.success,
        responseTime: latency,
        error: result.error,
        details: result.details
      }
    } catch (error) {
      const latency = this.getTimestamp() - start
      this.updateLatency(latency)
      this.recordFailure(error)
      throw error
    }
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics }
  }

  getLastError(): unknown {
    return this.lastError
  }

  getConfig(): TConfig | undefined {
    return this.currentConfig
  }

  addStatusListener(listener: (status: ConnectionStatus) => void): void {
    this.statusListeners.add(listener)
  }

  removeStatusListener(listener: (status: ConnectionStatus) => void): void {
    this.statusListeners.delete(listener)
  }

  protected setStatus(status: ConnectionStatus): void {
    if (this.status === status) {
      return
    }

    this.status = status
    this.metrics.status = status
    this.notifyStatusChange(status)
  }

  protected recordSuccess(latency?: number): void {
    this.metrics.successfulConnections += 1
    this.metrics.consecutiveFailures = 0
    this.metrics.lastConnectedAt = Date.now()
    this.lastError = undefined

    if (typeof latency === 'number') {
      this.updateLatency(latency)
    }
  }

  protected recordFailure(error: unknown): void {
    this.metrics.consecutiveFailures += 1
    this.metrics.lastError = error
    this.lastError = error

    this.options.logger?.warn('AI服务连接失败', {
      consecutiveFailures: this.metrics.consecutiveFailures,
      error: error instanceof Error ? error.message : error
    })
  }

  protected updateLatency(latency: number): void {
    this.metrics.lastLatency = latency

    const successful = Math.max(this.metrics.successfulConnections, 1)
    const previousAverage = this.metrics.averageLatency ?? latency
    this.metrics.averageLatency = previousAverage + (latency - previousAverage) / successful
  }

  protected getTimestamp(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now()
  }

  protected notifyStatusChange(status: ConnectionStatus): void {
    for (const listener of this.statusListeners) {
      try {
        listener(status)
      } catch (error) {
        this.options.logger?.warn('状态监听器执行失败', {
          error: error instanceof Error ? error.message : error
        })
      }
    }
  }

  protected maskUrl(url: string): string {
    try {
      const parsed = new URL(url)
      return `${parsed.origin}${parsed.pathname}`
    } catch {
      return url
    }
  }

  protected validateConfig(config: TConfig): void {
    if (!config.apiUrl) {
      throw new Error('AI服务连接需要提供apiUrl')
    }

    if (!config.apiKey) {
      throw new Error('AI服务连接需要提供apiKey')
    }
  }

  /**
   * 由具体适配器实现的实际连接过程，例如握手、凭证验证或健康检查。
   */
  protected abstract establishConnection(config: TConfig): Promise<void>
  /**
   * 清理与服务端的连接资源，例如关闭会话或释放连接池。
   */
  protected abstract terminateConnection(): Promise<void>
  /**
   * 执行连接测试并返回统一的测试结果（如响应耗时、功能特性检测）。
   */
  protected abstract performConnectionTest(config: TConfig): Promise<ConnectionTestResult>
}

