import { beforeEach, describe, expect, it } from 'vitest'
import { BaseAIServiceAdapter } from '../base/BaseAIServiceAdapter'
import { BaseConnectionManager } from '../connection/BaseConnectionManager'
import { BaseRequestHandler, type RequestExecutionParams, type RequestExecutionInternalResult } from '../request/BaseRequestHandler'
import { BaseErrorProcessor, type AdapterProcessedError, type ErrorMetadata } from '../errors/BaseErrorProcessor'
import type { EventBusAPI } from '@/types/interfaces'
import { AIProvider, AIServiceType, GameEvent, ErrorCategory, ErrorSeverity, RecoveryStrategy } from '@/types/enums'
import { ConnectionStatus, type AIConfig,
  AIRequest,
  AIResponse,
  ConnectionConfig,
  ConnectionTestResult,
  AdapterTelemetrySnapshot
} from '@/types/ai'
import { ErrorCode } from '@/types/error'
import type { StatusConfig, ExtensionConfig } from '@/types/config'

interface RequestBehavior {
  fail?: boolean
  failuresBeforeSuccess?: number
}

interface AdapterBehavior {
  failRequest?: boolean
  failuresBeforeSuccess?: number
}

function createConnectionConfig(): ConnectionConfig {
  return {
    apiUrl: 'https://api.example.com',
    apiKey: 'secret',
    model: 'demo',
    timeout: 1000,
    maxRetries: 2,
    retryDelay: 50
  }
}

function createAdapterConfig(): AIConfig {
  return {
    id: 'cfg',
    name: 'Demo',
    serviceType: AIServiceType.DEEPSEEK,
    connection: createConnectionConfig(),
    parameters: {
      temperature: 0.7,
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
    version: '1.0',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

function createRequest(id: string): AIRequest {
  return {
    id,
    prompt: 'Hello',
    config: {
      temperature: 0.5,
      maxTokens: 128,
      timeout: 1000,
      retryAttempts: 1,
      stream: false
    },
    metadata: {
      gameRound: 1,
      worldId: 'world',
      statusConfig: {} as StatusConfig,
      extensions: [] as ExtensionConfig[]
    },
    timestamp: Date.now()
  }
}

class StubConnectionManager extends BaseConnectionManager {
  public connectCount = 0
  public disconnectCount = 0
  public testCount = 0

  protected async establishConnection(_config: ConnectionConfig): Promise<void> {
    this.connectCount += 1
  }

  protected async terminateConnection(): Promise<void> {
    this.disconnectCount += 1
  }

  protected async performConnectionTest(_config: ConnectionConfig): Promise<ConnectionTestResult> {
    this.testCount += 1
    return {
      success: true,
      responseTime: 25,
      details: { apiVersion: 'v1' }
    }
  }
}

class StubRequestHandler extends BaseRequestHandler {
  public executeCount = 0
  private retryFailures = 0

  constructor(private readonly behavior: RequestBehavior = {}) {
    super()
  }

  protected async performRequest(
    params: RequestExecutionParams
  ): Promise<RequestExecutionInternalResult> {
    this.executeCount += 1
    if (this.behavior.fail) {
      throw new Error('request failed')
    }

    if (
      typeof this.behavior.failuresBeforeSuccess === 'number' &&
      this.retryFailures < this.behavior.failuresBeforeSuccess
    ) {
      this.retryFailures += 1
      throw new Error('rate limit')
    }

    const response: AIResponse = {
      id: params.request.id,
      success: true,
      timestamp: Date.now(),
      data: undefined,
      metadata: {
        processingTime: 12,
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        modelUsed: params.config.connection.model,
        apiVersion: 'v1'
      }
    }

    return {
      response,
      rawResponse: { ok: true },
      tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
    }
  }
}

class StubErrorProcessor extends BaseErrorProcessor {
  public processed: AdapterProcessedError[] = []

  constructor() {
    super({ provider: AIProvider.DEEPSEEK, defaultCategory: ErrorCategory.AI_SERVICE })
  }

  protected getProviderErrorCode(error: unknown, _metadata: ErrorMetadata): ErrorCode | null {
    if (error instanceof Error && error.message === 'request failed') {
      return ErrorCode.API_KEY_INVALID
    }
    if (error instanceof Error && error.message === 'rate limit') {
      return ErrorCode.DEEPSEEK_RATE_LIMIT_EXCEEDED
    }
    return null
  }

  override process(error: unknown, metadata: ErrorMetadata = {}): AdapterProcessedError {
    const processed = super.process(error, metadata)
    this.processed.push(processed)
    return processed
  }
}

class StubEventBus implements EventBusAPI {
  public events: { event: string; payload: unknown }[] = []

  emit<T>(event: string, data: T): void {
    this.events.push({ event, payload: data })
  }

  on(): () => void {
    return () => {}
  }
  once(): () => void {
    return () => {}
  }
  off(): void {}
  clear(): void {}
  hasSubscribers(): boolean {
    return false
  }
  getStats() {
    return { totalEvents: 0, eventsByType: {}, subscriberCount: 0, processingTimes: [] }
  }
  getSubscriberCount(): number {
    return 0
  }
  destroy(): void {}
}

class TestAdapter extends BaseAIServiceAdapter {
  private static nextBehavior: AdapterBehavior = {}

  private connectionManagerInstance!: StubConnectionManager
  private requestHandlerInstance!: StubRequestHandler
  private errorProcessorInstance!: StubErrorProcessor

  constructor(behavior: AdapterBehavior = {}, eventBus?: EventBusAPI) {
    TestAdapter.nextBehavior = behavior
    super(AIProvider.DEEPSEEK, { eventBus })
    this.connectionManagerInstance = this.connectionManager as StubConnectionManager
    this.requestHandlerInstance = this.requestHandler as StubRequestHandler
    this.errorProcessorInstance = this.errorProcessor as StubErrorProcessor
  }

  get connectionManagerStub(): StubConnectionManager {
    return this.connectionManagerInstance
  }

  get requestHandlerStub(): StubRequestHandler {
    return this.requestHandlerInstance
  }

  get errorProcessorStub(): StubErrorProcessor {
    return this.errorProcessorInstance
  }

  protected createConnectionManager(): StubConnectionManager {
    this.connectionManagerInstance = new StubConnectionManager()
    return this.connectionManagerInstance
  }

  protected createRequestHandler(): StubRequestHandler {
    const behavior = TestAdapter.nextBehavior
    this.requestHandlerInstance = new StubRequestHandler({
      fail: behavior.failRequest,
      failuresBeforeSuccess: behavior.failuresBeforeSuccess
    })
    return this.requestHandlerInstance
  }

  protected createErrorProcessor(): StubErrorProcessor {
    this.errorProcessorInstance = new StubErrorProcessor()
    return this.errorProcessorInstance
  }
}

describe('BaseAIServiceAdapter', () => {
  let eventBus: StubEventBus
  let adapter: TestAdapter

  beforeEach(async () => {
    eventBus = new StubEventBus()
    adapter = new TestAdapter({}, eventBus)
    await adapter.initialize(createAdapterConfig())
  })

  it('connects during initialization', () => {
    expect(adapter.getConnectionStatus()).toBe(ConnectionStatus.CONNECTED)
    expect(adapter.connectionManagerStub.connectCount).toBe(1)
  })

  it('sends requests and updates usage stats', async () => {
    const request = createRequest('req-success')
    const response = await adapter.sendRequest(request)

    expect(response.success).toBe(true)
    const stats = adapter.getUsageStats()
    expect(stats.totalRequests).toBe(1)
    expect(stats.successfulRequests).toBe(1)
    expect(stats.failedRequests).toBe(0)
    expect(eventBus.events.some(evt => evt.event === GameEvent.AI_REQUEST_COMPLETED)).toBe(true)
  })

  it('retries retryable errors before succeeding', async () => {
    const retryBus = new StubEventBus()
    const retryingAdapter = new TestAdapter({ failuresBeforeSuccess: 1 }, retryBus)
    await retryingAdapter.initialize(createAdapterConfig())

    const request = createRequest('req-retry')
    const response = await retryingAdapter.sendRequest(request)

    expect(response.success).toBe(true)
    expect(retryingAdapter.requestHandlerStub.executeCount).toBe(2)
    expect(retryingAdapter.errorProcessorStub.processed).toHaveLength(1)
    expect(retryBus.events.filter(evt => evt.event === GameEvent.AI_REQUEST_FAILED)).toHaveLength(0)

    const completionEvent = retryBus.events.find(evt => evt.event === GameEvent.AI_REQUEST_COMPLETED)
    expect((completionEvent?.payload as { attempt?: number } | undefined)?.attempt).toBe(1)

    await retryingAdapter.disconnect()
  })

  it('converts request errors via error processor', async () => {
    const localBus = new StubEventBus()
    const failingAdapter = new TestAdapter({ failRequest: true }, localBus)
    await failingAdapter.initialize(createAdapterConfig())

    await expect(failingAdapter.sendRequest(createRequest('req-fail'))).rejects.toMatchObject({
      code: ErrorCode.API_KEY_INVALID,
      provider: AIProvider.DEEPSEEK,
      recovery: RecoveryStrategy.USER_ACTION
    })

    const stats = failingAdapter.getUsageStats()
    expect(stats.failedRequests).toBe(1)
    expect(localBus.events.some(evt => evt.event === GameEvent.AI_REQUEST_FAILED)).toBe(true)
    expect(failingAdapter.errorProcessorStub.processed).toHaveLength(1)
  })

  it('returns telemetry snapshot', async () => {
    await adapter.sendRequest(createRequest('telemetry'))
    const telemetry: AdapterTelemetrySnapshot = adapter.getTelemetry()

    expect(telemetry.usage.totalRequests).toBe(1)
    expect(telemetry.connection.status).toBe(ConnectionStatus.CONNECTED)
    expect(telemetry.connection.metrics.totalAttempts).toBeGreaterThanOrEqual(1)
  })

  it('delegates testConnection to connection manager', async () => {
    const result = await adapter.testConnection()
    expect(result.success).toBe(true)
    expect(adapter.connectionManagerStub.testCount).toBe(1)
  })

  it('handles manual errors through processor', () => {
    const processed = adapter.handleError(new Error('manual'))
    expect(processed.provider).toBe(AIProvider.DEEPSEEK)
    expect(processed.category).toBe(ErrorCategory.AI_SERVICE)
    expect(processed.severity).toBe(ErrorSeverity.HIGH)
  })
})
