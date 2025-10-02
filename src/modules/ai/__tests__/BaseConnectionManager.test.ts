import { describe, expect, it, vi } from 'vitest'
import { BaseConnectionManager, type ConnectionManagerOptions } from '../connection/BaseConnectionManager'
import {
  ConnectionStatus,
  type ConnectionConfig,
  type ConnectionTestResult,
  type ConnectionMetrics
} from '@/types/ai'

interface ManagerBehavior {
  connectError?: Error
  testError?: Error
}

function createConfig(): ConnectionConfig {
  return {
    apiUrl: 'https://api.example.com',
    apiKey: 'secret',
    model: 'demo',
    timeout: 1000,
    maxRetries: 2,
    retryDelay: 100
  }
}

class TestConnectionManager extends BaseConnectionManager {
  public connectCalls = 0
  public disconnectCalls = 0
  public testCalls = 0

  constructor(private readonly behavior: ManagerBehavior = {}, options?: ConnectionManagerOptions) {
    super(options)
  }

  protected async establishConnection(_config: ConnectionConfig): Promise<void> {
    this.connectCalls += 1
    if (this.behavior.connectError) {
      throw this.behavior.connectError
    }
  }

  protected async terminateConnection(): Promise<void> {
    this.disconnectCalls += 1
  }

  protected async performConnectionTest(_config: ConnectionConfig): Promise<ConnectionTestResult> {
    this.testCalls += 1
    if (this.behavior.testError) {
      throw this.behavior.testError
    }

    return {
      success: true,
      responseTime: 25
    }
  }
}

describe('BaseConnectionManager', () => {
  it('updates status and metrics on successful connection', async () => {
    const statusSpy = vi.fn()
    const manager = new TestConnectionManager({}, { onStatusChange: statusSpy })

    await manager.connect(createConfig())

    expect(manager.getStatus()).toBe(ConnectionStatus.CONNECTED)
    const metrics = manager.getMetrics()
    expect(metrics.status).toBe(ConnectionStatus.CONNECTED)
    expect(metrics.successfulConnections).toBe(1)
    expect(metrics.consecutiveFailures).toBe(0)
    expect(statusSpy).toHaveBeenCalledWith(ConnectionStatus.CONNECTING)
    expect(statusSpy).toHaveBeenCalledWith(ConnectionStatus.CONNECTED)
  })

  it('records failures when connection throws', async () => {
    const error = new Error('boom')
    const manager = new TestConnectionManager({ connectError: error })

    await expect(manager.connect(createConfig())).rejects.toThrowError('boom')

    const metrics = manager.getMetrics()
    expect(metrics.status).toBe(ConnectionStatus.ERROR)
    expect(metrics.consecutiveFailures).toBe(1)
    expect(manager.getLastError()).toBe(error)
  })

  it('runs connection test and updates latency metrics', async () => {
    const manager = new TestConnectionManager()
    await manager.connect(createConfig())

    const result = await manager.testConnection()
    expect(result.success).toBe(true)

    const metrics: ConnectionMetrics = manager.getMetrics()
    expect(metrics.lastLatency).toBeGreaterThanOrEqual(0)
    expect(manager.getLastError()).toBeUndefined()
    expect(manager.testCalls).toBe(1)
  })

  it('propagates connection test errors', async () => {
    const manager = new TestConnectionManager({ testError: new Error('test failed') })

    await expect(manager.testConnection(createConfig())).rejects.toThrowError('test failed')

    const metrics = manager.getMetrics()
    expect(metrics.consecutiveFailures).toBe(1)
    expect(manager.getLastError()).toBeInstanceOf(Error)
  })
})
