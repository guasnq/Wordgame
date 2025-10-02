import { describe, expect, it } from 'vitest'
import { BaseRequestHandler, type RequestHandlerOptions, type RequestExecutionParams } from '../request/BaseRequestHandler'
import type {
  AIConfig,
  AIRequest,
  AIResponse,
  RequestExecutionInternalResult
} from '@/types/ai'
import type { StatusConfig, ExtensionConfig } from '@/types/config'
import { AIServiceType } from '@/types/enums'

interface HandlerBehavior {
  fail?: boolean
}

function createConfig(): AIConfig {
  return {
    id: 'cfg-1',
    name: 'Demo cfg',
    serviceType: AIServiceType.DEEPSEEK,
    connection: {
      apiUrl: 'https://api.example.com',
      apiKey: 'secret',
      model: 'demo',
      timeout: 1000,
      maxRetries: 2,
      retryDelay: 50
    },
    parameters: {
      temperature: 0.5,
      maxTokens: 256,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      stopSequences: []
    },
    advanced: {
      useStreaming: false,
      enableCaching: false,
      cacheExpiration: 0,
      enableCompression: false,
      customHeaders: {},
      fallbackModel: undefined,
      autoSwitchOnError: false,
      errorThreshold: 1,
      connectionPooling: false,
      keepAlive: false,
      compressionLevel: 0,
      enableMetrics: false,
      enableTracing: false,
      logLevel: 'info',
      experimentalFeatures: {
        enableFunctionCalling: false,
        enableToolUse: false,
        enableMultimodalInput: false,
        enableBatchProcessing: false
      }
    },
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

function createRequest(): AIRequest {
  return {
    id: 'req-1',
    prompt: 'Hello',
    config: {
      temperature: 0.6,
      maxTokens: 300,
      timeout: 2000,
      retryAttempts: 1,
      stream: false
    },
    metadata: {
      gameRound: 1,
      worldId: 'world-1',
      statusConfig: {} as StatusConfig,
      extensions: [] as ExtensionConfig[]
    },
    timestamp: Date.now()
  }
}

class TestRequestHandler extends BaseRequestHandler {
  public beforeCalls = 0
  public successCalls = 0
  public failureCalls = 0

  constructor(private readonly behavior: HandlerBehavior = {}, options?: RequestHandlerOptions) {
    super(options)
  }

  protected async beforeRequest(params: RequestExecutionParams): Promise<void> {
    this.beforeCalls += 1
    await super.beforeRequest(params)
  }

  protected async afterSuccess(
    result: RequestExecutionInternalResult,
    params: RequestExecutionParams
  ): Promise<void> {
    this.successCalls += 1
    await super.afterSuccess(result, params)
  }

  protected async afterFailure(
    error: unknown,
    params: RequestExecutionParams,
    latency: number
  ): Promise<void> {
    this.failureCalls += 1
    await super.afterFailure(error, params, latency)
  }

  protected async performRequest(
    params: RequestExecutionParams
  ): Promise<RequestExecutionInternalResult> {
    if (this.behavior.fail) {
      throw new Error('network error')
    }

    const response: AIResponse = {
      id: params.request.id,
      success: true,
      timestamp: Date.now(),
      data: undefined,
      metadata: {
        processingTime: 10,
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        modelUsed: params.config.connection.model,
        apiVersion: 'demo'
      }
    }

    return {
      response,
      rawResponse: { ok: true },
      tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
    }
  }
}

describe('BaseRequestHandler', () => {
  it('tracks metrics for successful requests', async () => {
    const handler = new TestRequestHandler()
    const result = await handler.execute({ request: createRequest(), config: createConfig() })

    expect(result.response.success).toBe(true)
    const metrics = handler.getMetrics()
    expect(metrics.totalRequests).toBe(1)
    expect(metrics.successfulRequests).toBe(1)
    expect(metrics.failedRequests).toBe(0)
    expect(metrics.averageLatency).toBeGreaterThanOrEqual(0)
    expect(handler.beforeCalls).toBe(1)
    expect(handler.successCalls).toBe(1)
    expect(handler.failureCalls).toBe(0)
  })

  it('records failures and preserves metrics', async () => {
    const handler = new TestRequestHandler({ fail: true })

    await expect(handler.execute({ request: createRequest(), config: createConfig() })).rejects.toThrowError(
      'network error'
    )

    const metrics = handler.getMetrics()
    expect(metrics.totalRequests).toBe(1)
    expect(metrics.successfulRequests).toBe(0)
    expect(metrics.failedRequests).toBe(1)
    expect(handler.failureCalls).toBe(1)
  })

  it('resets metrics', async () => {
    const handler = new TestRequestHandler()
    await handler.execute({ request: createRequest(), config: createConfig() })
    handler.resetMetrics()

    const metrics = handler.getMetrics()
    expect(metrics.totalRequests).toBe(0)
    expect(metrics.successfulRequests).toBe(0)
    expect(metrics.failedRequests).toBe(0)
  })
})
