import { describe, expect, it } from 'vitest'
import { DeepSeekRequestBuilder, type DeepSeekRequestBuilderOptions, type DeepSeekRequestConfig } from '../request/DeepSeekRequestBuilder'
import type { RequestConfig } from '@/types/ai'

type BuilderConfig = DeepSeekRequestConfig & RequestConfig

function createConfig(overrides: Partial<BuilderConfig> = {}): BuilderConfig {
  return {
    temperature: 0.75,
    maxTokens: 2048,
    timeout: 30000,
    retryAttempts: 1,
    stream: false,
    ...overrides
  }
}

describe('DeepSeekRequestBuilder', () => {
  it('builds a minimal request with defaults', () => {
    const builder = new DeepSeekRequestBuilder()
    const request = builder.buildRequest('Hello DeepSeek', createConfig())

    expect(request.model).toBe('deepseek-chat')
    expect(request.messages).toHaveLength(1)
    expect(request.messages[0]).toEqual({ role: 'user', content: 'Hello DeepSeek' })
    expect(request.temperature).toBeCloseTo(0.75)
    expect(request.max_tokens).toBe(2048)
    expect(request.stream).toBe(false)
    expect(request.reasoning).toBeUndefined()
    expect(request.kv_cache).toBeUndefined()
  })

  it('clamps numeric parameters to valid ranges', () => {
    const builder = new DeepSeekRequestBuilder()
    const request = builder.buildRequest('testing', createConfig({
      temperature: 3,
      maxTokens: 999999,
      topP: -2,
      frequencyPenalty: 9,
      presencePenalty: -9,
      repetitionPenalty: 0.45678
    }))

    expect(request.temperature).toBe(2)
    expect(request.max_tokens).toBe(32768)
    expect(request.top_p).toBe(0)
    expect(request.frequency_penalty).toBe(2)
    expect(request.presence_penalty).toBe(-2)
    expect(request.repetition_penalty).toBeCloseTo(0.457)
  })

  it('applies reasoning mode via builder toggle', () => {
    const builder = new DeepSeekRequestBuilder()
    builder.enableReasoningMode(true)

    const request = builder.buildRequest('reason about this', createConfig({ model: 'deepseek-chat' }))

    expect(request.model).toBe('deepseek-reasoner')
    expect(request.reasoning).toBe(true)
  })

  it('gives precedence to per-request reasoning flag over builder toggle', () => {
    const builder = new DeepSeekRequestBuilder()
    builder.enableReasoningMode(true)

    const request = builder.buildRequest('no reasoning please', createConfig({
      enableReasoning: false,
      model: 'deepseek-reasoner'
    }))

    expect(request.model).toBe('deepseek-chat')
    expect(request.reasoning).toBeUndefined()
  })

  it('merges system prompt and stop sequences without duplicates', () => {
    const options: DeepSeekRequestBuilderOptions = {
      systemPrompt: 'You are a helpful assistant',
      stopSequences: ['END', 'STOP']
    }
    const builder = new DeepSeekRequestBuilder(options)

    const request = builder.buildRequest('respond now', createConfig({
      stopSequences: ['STOP', 'DONE', ''],
      topP: undefined,
      presencePenalty: undefined
    }))

    expect(request.messages).toEqual([
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'respond now' }
    ])
    expect(request.stop).toEqual(['END', 'STOP', 'DONE'])
    expect(request.top_p).toBeUndefined()
  })

  it('respects compatibility mode and kv cache options', () => {
    const builder = new DeepSeekRequestBuilder({
      enableCache: true,
      cacheStrategy: 'manual',
      compatibilityMode: 'openai'
    })

    const request = builder.buildRequest('cache me', createConfig({
      enableKVCache: true,
      cacheStrategy: 'auto',
      compatibilityMode: 'anthropic'
    }))

    expect(request.kv_cache).toEqual({ enabled: true, strategy: 'auto' })
    expect(request.compatibility_mode).toBe('anthropic')
  })

  it('falls back to builder-level cache strategy when request omits it', () => {
    const builder = new DeepSeekRequestBuilder({ enableCache: true, cacheStrategy: 'manual' })
    const request = builder.buildRequest('default strategy', createConfig({ enableKVCache: true }))

    expect(request.kv_cache).toEqual({ enabled: true, strategy: 'manual' })
  })

  it('returns undefined kv cache when disabled explicitly', () => {
    const builder = new DeepSeekRequestBuilder({ enableCache: true })
    const request = builder.buildRequest('disabled cache', createConfig({ enableKVCache: false }))

    expect(request.kv_cache).toBeUndefined()
  })

  it('uses builder level top_p when per-request value is missing', () => {
    const builder = new DeepSeekRequestBuilder({ topP: 0.876 })
    const request = builder.buildRequest('top p fallback', createConfig({ topP: undefined }))

    expect(request.top_p).toBeCloseTo(0.876)
  })

  it('throws when prompt is empty after trimming', () => {
    const builder = new DeepSeekRequestBuilder()

    expect(() => builder.buildRequest('   ', createConfig())).toThrowError('DeepSeek请求prompt不能为空')
  })
})
