import type { AIConfig, AIRequest, AIResponse, TokenUsage } from '@/types/ai'
import type { AIAdapterLogger } from '../base/types'

export interface RequestExecutionParams {
  request: AIRequest
  config: AIConfig
  abortSignal?: AbortSignal
  metadata?: Record<string, unknown>
}

export interface RequestExecutionInternalResult {
  response: AIResponse
  rawResponse?: unknown
  tokenUsage?: TokenUsage
  metadata?: Record<string, unknown>
}

export interface RequestExecutionResult extends RequestExecutionInternalResult {
  latency: number
}

export interface RequestMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageLatency: number
  p95Latency: number
  lastLatency?: number
  lastError?: unknown
}

export interface RequestHandlerOptions {
  logger?: AIAdapterLogger
  latencySampleSize?: number
}

const DEFAULT_SAMPLE_SIZE = 20

/**
 * 请求/响应处理基类
 * 提供请求生命周期管理、性能统计与钩子扩展点
 */
export abstract class BaseRequestHandler {
  protected metrics: RequestMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    p95Latency: 0
  }

  private readonly latencySamples: number[] = []

  constructor(protected readonly options: RequestHandlerOptions = {}) {}

  async execute(params: RequestExecutionParams): Promise<RequestExecutionResult> {
    this.metrics.totalRequests += 1
    const start = this.getTimestamp()

    await this.beforeRequest(params)

    try {
      const internalResult = await this.performRequest(params)
      const latency = this.getTimestamp() - start
      const response = this.enrichResponse(internalResult.response, latency, internalResult.tokenUsage)

      this.recordSuccess(latency)
      await this.afterSuccess({ ...internalResult, response, latency }, params)

      return {
        ...internalResult,
        response,
        latency
      }
    } catch (error) {
      const latency = this.getTimestamp() - start
      this.recordFailure(latency, error)
      await this.afterFailure(error, params, latency)
      throw error
    }
  }

  getMetrics(): RequestMetrics {
    return { ...this.metrics }
  }

  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      p95Latency: 0
    }
    this.latencySamples.length = 0
  }

  protected async beforeRequest(params: RequestExecutionParams): Promise<void> {
    this.options.logger?.debug('准备发送AI请求', { requestId: params.request.id })
  }

  protected async afterSuccess(
    result: RequestExecutionResult,
    params: RequestExecutionParams
  ): Promise<void> {
    this.options.logger?.debug('AI请求完成', {
      requestId: params.request.id,
      latency: result.latency
    })
  }

  protected async afterFailure(
    error: unknown,
    params: RequestExecutionParams,
    latency: number
  ): Promise<void> {
    this.options.logger?.warn('AI请求失败', {
      requestId: params.request.id,
      latency,
      error: error instanceof Error ? error.message : error
    })
  }

  protected enrichResponse(
    response: AIResponse,
    latency: number,
    tokenUsage?: TokenUsage
  ): AIResponse {
    const metadata = response.metadata
      ? {
          ...response.metadata,
          processingTime: response.metadata.processingTime ?? latency,
          tokenUsage: tokenUsage ?? response.metadata.tokenUsage
        }
      : {
          processingTime: latency,
          tokenUsage: tokenUsage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          modelUsed: 'unknown',
          apiVersion: 'unknown'
        }

    return {
      ...response,
      metadata
    }
  }

  protected recordSuccess(latency: number): void {
    this.metrics.successfulRequests += 1
    this.metrics.lastLatency = latency
    this.metrics.lastError = undefined
    this.updateAverageLatency(latency)
    this.updateLatencySamples(latency)
  }

  protected recordFailure(latency: number, error: unknown): void {
    this.metrics.failedRequests += 1
    this.metrics.lastLatency = latency
    this.metrics.lastError = error
    this.updateLatencySamples(latency)
  }

  protected updateAverageLatency(latency: number): void {
    if (this.metrics.successfulRequests === 0) {
      this.metrics.averageLatency = latency
      return
    }

    const previousAverage = this.metrics.averageLatency
    const count = this.metrics.successfulRequests

    if (count <= 1) {
      this.metrics.averageLatency = latency
      return
    }

    this.metrics.averageLatency = previousAverage + (latency - previousAverage) / count
  }

  protected updateLatencySamples(latency: number): void {
    const limit = this.options.latencySampleSize ?? DEFAULT_SAMPLE_SIZE
    this.latencySamples.push(latency)

    if (this.latencySamples.length > limit) {
      this.latencySamples.splice(0, this.latencySamples.length - limit)
    }

    const percentile = this.calculatePercentile(this.latencySamples, 95)
    if (percentile !== undefined) {
      this.metrics.p95Latency = percentile
    }
  }

  protected calculatePercentile(values: number[], percentile: number): number | undefined {
    if (!values.length) {
      return undefined
    }

    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.min(sorted.length - 1, Math.floor(((percentile / 100) * (sorted.length - 1))))
    return sorted[index]
  }

  protected getTimestamp(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now()
  }

  /**
   * 构建并发送具体的AI请求，返回原始响应数据及可选元信息。
   * 该方法应抛出错误以便框架统一处理失败与重试逻辑。
   */
  protected abstract performRequest(
    params: RequestExecutionParams
  ): Promise<RequestExecutionInternalResult>
}
