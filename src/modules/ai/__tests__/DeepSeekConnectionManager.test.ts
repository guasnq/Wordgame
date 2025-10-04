import { describe, expect, it, vi } from 'vitest'
import type { DeepSeekConfig } from '@/types/ai'
import { ConnectionStatus } from '@/types/ai'
import { DeepSeekConnectionManager } from '../connection/DeepSeekConnectionManager'

function createConfig(overrides: Partial<DeepSeekConfig> = {}): DeepSeekConfig {
  return {
    apiUrl: 'https://api.deepseek.com',
    apiKey: 'sk-' + 'A'.repeat(32),
    model: 'deepseek-chat',
    timeout: 10000,
    maxRetries: 2,
    retryDelay: 200,
    supportReasoning: true,
    enableCache: true,
    cacheStrategy: 'auto',
    compatibilityMode: 'openai',
    reasoningModeEnabled: true,
    ...overrides
  }
}

function createFetchStub(payload?: Record<string, unknown>, status = 200) {
  const responsePayload =
    payload ?? {
      data: [{ id: 'deepseek-chat' }, { id: 'deepseek-reasoner' }],
      meta: { version: '2024-09-01' }
    }

  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Unauthorized',
    json: vi.fn().mockResolvedValue(responsePayload)
  } as unknown as Response

  return vi.fn().mockResolvedValue(response) as unknown as typeof fetch
}

describe('DeepSeekConnectionManager', () => {
  it('建立连接时校验API密钥并应用推理模式配置', async () => {
    const fetchMock = createFetchStub()
    const manager = new DeepSeekConnectionManager({ fetchImplementation: fetchMock })
    await manager.connect(createConfig())

    expect(manager.getStatus()).toBe(ConnectionStatus.CONNECTED)
    expect(fetchMock).toHaveBeenCalledWith('https://api.deepseek.com/v1/models', expect.any(Object))
    expect(manager.isReasoningModeSupported()).toBe(true)
    expect(manager.isReasoningModeEnabled()).toBe(true)

    manager.setReasoningMode(false)
    expect(manager.isReasoningModeEnabled()).toBe(false)
  })

  it('当API密钥格式不正确时抛出错误', async () => {
    const fetchMock = createFetchStub()
    const manager = new DeepSeekConnectionManager({ fetchImplementation: fetchMock })
    await expect(manager.connect(createConfig({ apiKey: 'invalid' }))).rejects.toThrow('格式不正确')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('连接测试返回服务特性信息', async () => {
    const fetchMock = createFetchStub()
    const manager = new DeepSeekConnectionManager({ fetchImplementation: fetchMock })
    const config = createConfig()

    // 先建立连接以激活推理模式
    await manager.connect(config)

    const result = await manager.testConnection()
    expect(result.success).toBe(true)
    expect(result.details?.modelAvailable).toBe(true)
    expect(result.details?.features).toContain('kv_cache')
    expect(result.details?.features).toContain('reasoning:on')
  })

  it('当服务未提供推理模型时禁用推理模式并阻止开启', async () => {
    const fetchMock = createFetchStub({ data: [{ id: 'deepseek-chat' }], meta: { version: '2024-09-01' } })
    const manager = new DeepSeekConnectionManager({ fetchImplementation: fetchMock })
    const config = createConfig()

    await manager.connect(config)
    expect(manager.isReasoningModeSupported()).toBe(false)
    expect(manager.isReasoningModeEnabled()).toBe(false)
    expect(() => manager.setReasoningMode(true)).toThrow('不支持推理模式')
  })

  it('连接测试标识无效密钥', async () => {
    const fetchMock = createFetchStub({}, 401)
    const manager = new DeepSeekConnectionManager({ fetchImplementation: fetchMock })

    await expect(manager.testConnection(createConfig())).rejects.toThrow('无效')
  })
})

