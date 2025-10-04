import type { AIMessage, DeepSeekRequestBody, RequestConfig } from '@/types/ai'

export type DeepSeekCompatibilityMode = 'openai' | 'anthropic' | 'native'
export type DeepSeekCacheStrategy = 'auto' | 'manual'

export interface DeepSeekRequestBuilderOptions {
  defaultModel?: string
  enableCache?: boolean
  cacheStrategy?: DeepSeekCacheStrategy
  compatibilityMode?: DeepSeekCompatibilityMode
  systemPrompt?: string
  stopSequences?: string[]
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  repetitionPenalty?: number
}

export interface DeepSeekRequestConfig extends RequestConfig {
  model?: string
  systemPrompt?: string
  stopSequences?: string[]
  enableReasoning?: boolean
  enableKVCache?: boolean
  cacheStrategy?: DeepSeekCacheStrategy
  compatibilityMode?: DeepSeekCompatibilityMode
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  repetitionPenalty?: number
}

interface NormalizedBuilderOptions {
  defaultModel: string
  enableCache: boolean
  cacheStrategy?: DeepSeekCacheStrategy
  compatibilityMode?: DeepSeekCompatibilityMode
  systemPrompt?: string
  stopSequences?: string[]
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  repetitionPenalty?: number
}

const DEFAULT_MODEL = 'deepseek-chat'
const REASONING_MODEL = 'deepseek-reasoner'
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 2048
const MIN_TEMPERATURE = 0
const MAX_TEMPERATURE = 2
const MIN_TOP_P = 0
const MAX_TOP_P = 1
const MIN_MAX_TOKENS = 1
const MAX_MAX_TOKENS = 32768
const MIN_PENALTY = -2
const MAX_PENALTY = 2

export class DeepSeekRequestBuilder {
  private reasoningEnabled = false
  private readonly options: NormalizedBuilderOptions

  constructor(options: DeepSeekRequestBuilderOptions = {}) {
    this.options = {
      defaultModel: this.normalizeModel(options.defaultModel) ?? DEFAULT_MODEL,
      enableCache: options.enableCache ?? false,
      cacheStrategy: this.normalizeCacheStrategy(options.cacheStrategy),
      compatibilityMode: this.normalizeCompatibilityMode(options.compatibilityMode),
      systemPrompt: this.normalizeOptionalText(options.systemPrompt),
      stopSequences: this.normalizeStopSequences(options.stopSequences),
      topP: this.normalizeTopP(options.topP),
      frequencyPenalty: this.normalizePenalty(options.frequencyPenalty),
      presencePenalty: this.normalizePenalty(options.presencePenalty),
      repetitionPenalty: this.normalizePenalty(options.repetitionPenalty)
    }
  }

  enableReasoningMode(enabled: boolean): void {
    this.reasoningEnabled = enabled
  }

  buildRequest(prompt: string, config: RequestConfig): DeepSeekRequestBody {
    const normalizedPrompt = this.normalizePrompt(prompt)
    if (!normalizedPrompt) {
      throw new Error('DeepSeek请求prompt不能为空')
    }

    const requestConfig = config as DeepSeekRequestConfig
    const requestedModel = this.normalizeModel(requestConfig.model) ?? this.options.defaultModel
    const useReasoning = this.resolveReasoning(requestConfig, requestedModel)
    const model = this.resolveModelName(requestedModel, useReasoning)

    const temperature = this.normalizeTemperature(config.temperature)
    const maxTokens = this.normalizeMaxTokens(config.maxTokens)
    const stream = Boolean(config.stream)

    const systemPrompt = this.normalizeOptionalText(requestConfig.systemPrompt) ?? this.options.systemPrompt
    const messages = this.buildMessages(normalizedPrompt, systemPrompt)

    const body: DeepSeekRequestBody = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream
    }

    if (useReasoning) {
      body.reasoning = true
    }

    const stopSequences = this.mergeStopSequences(this.options.stopSequences, requestConfig.stopSequences)
    if (stopSequences && stopSequences.length > 0) {
      body.stop = stopSequences
    }

    const topP = this.resolveTopP(requestConfig.topP)
    if (topP !== undefined) {
      body.top_p = topP
    }

    const frequencyPenalty = this.resolvePenalty(requestConfig.frequencyPenalty, this.options.frequencyPenalty)
    if (frequencyPenalty !== undefined) {
      body.frequency_penalty = frequencyPenalty
    }

    const presencePenalty = this.resolvePenalty(requestConfig.presencePenalty, this.options.presencePenalty)
    if (presencePenalty !== undefined) {
      body.presence_penalty = presencePenalty
    }

    const repetitionPenalty = this.resolvePenalty(requestConfig.repetitionPenalty, this.options.repetitionPenalty)
    if (repetitionPenalty !== undefined) {
      body.repetition_penalty = repetitionPenalty
    }

    const compatibilityMode = this.resolveCompatibilityMode(requestConfig.compatibilityMode)
    if (compatibilityMode) {
      body.compatibility_mode = compatibilityMode
    }

    const kvCache = this.resolveKvCache(requestConfig)
    if (kvCache) {
      body.kv_cache = kvCache
    }

    return body
  }

  // KV缓存配置需要明确开关与策略，避免无效参数发送到API。
  private resolveKvCache(config: DeepSeekRequestConfig): DeepSeekRequestBody['kv_cache'] | undefined {
    const override = config.enableKVCache
    const enabled = override ?? this.options.enableCache
    if (!enabled) {
      return undefined
    }

    const strategy = this.normalizeCacheStrategy(config.cacheStrategy) ?? this.options.cacheStrategy ?? 'auto'
    return {
      enabled: true,
      strategy
    }
  }

  private resolveCompatibilityMode(override?: DeepSeekCompatibilityMode): DeepSeekCompatibilityMode | undefined {
    return this.normalizeCompatibilityMode(override) ?? this.options.compatibilityMode
  }

  private resolveTopP(override?: number): number | undefined {
    const sanitized = this.normalizeTopP(override)
    if (sanitized !== undefined) {
      return sanitized
    }
    return this.options.topP
  }

  private resolvePenalty(override?: number, fallback?: number): number | undefined {
    const sanitized = this.normalizePenalty(override)
    if (sanitized !== undefined) {
      return sanitized
    }
    return fallback
  }

  private mergeStopSequences(base?: string[], override?: string[]): string[] | undefined {
    const normalizedBase = this.normalizeStopSequences(base)
    const normalizedOverride = this.normalizeStopSequences(override)
    if (!normalizedBase && !normalizedOverride) {
      return undefined
    }

    const merged = [
      ...(normalizedBase ?? []),
      ...(normalizedOverride ?? [])
    ]

    const unique = Array.from(new Set(merged))
    return unique.length > 0 ? unique : undefined
  }

  // 推理模式开启后统一使用deepseek-reasoner模型。
  private resolveReasoning(config: DeepSeekRequestConfig, requestedModel: string): boolean {
    if (typeof config.enableReasoning === 'boolean') {
      return config.enableReasoning
    }

    if (this.reasoningEnabled) {
      return true
    }

    return requestedModel.toLowerCase().includes('reasoner')
  }
  private resolveModelName(requestedModel: string, useReasoning: boolean): string {
    if (useReasoning) {
      return REASONING_MODEL
    }

    if (requestedModel === REASONING_MODEL) {
      return DEFAULT_MODEL
    }

    return requestedModel
  }

  private buildMessages(prompt: string, systemPrompt?: string): AIMessage[] {
    const messages: AIMessage[] = []
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      })
    }

    messages.push({
      role: 'user',
      content: prompt
    })

    return messages
  }

  private normalizePrompt(prompt: string): string {
    if (typeof prompt !== 'string') {
      return ''
    }
    return prompt.trim()
  }

  private normalizeModel(model?: string): string | undefined {
    if (!model) {
      return undefined
    }
    const trimmed = model.trim()
    if (!trimmed) {
      return undefined
    }

    const lower = trimmed.toLowerCase()
    if (lower === REASONING_MODEL) {
      return REASONING_MODEL
    }
    if (lower === DEFAULT_MODEL) {
      return DEFAULT_MODEL
    }

    return trimmed
  }

  private normalizeTemperature(value: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return DEFAULT_TEMPERATURE
    }
    const clamped = this.clamp(value, MIN_TEMPERATURE, MAX_TEMPERATURE)
    return Math.round(clamped * 1000) / 1000
  }

  private normalizeMaxTokens(value: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return DEFAULT_MAX_TOKENS
    }
    const clamped = this.clamp(value, MIN_MAX_TOKENS, MAX_MAX_TOKENS)
    return Math.floor(clamped)
  }

  private normalizeTopP(value?: number): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return undefined
    }
    const clamped = this.clamp(value, MIN_TOP_P, MAX_TOP_P)
    return Math.round(clamped * 1000) / 1000
  }

  private normalizePenalty(value?: number): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return undefined
    }
    const clamped = this.clamp(value, MIN_PENALTY, MAX_PENALTY)
    return Math.round(clamped * 1000) / 1000
  }

  private normalizeCacheStrategy(value?: DeepSeekCacheStrategy): DeepSeekCacheStrategy | undefined {
    if (value === 'auto' || value === 'manual') {
      return value
    }
    return undefined
  }

  private normalizeCompatibilityMode(value?: DeepSeekCompatibilityMode): DeepSeekCompatibilityMode | undefined {
    if (value === 'openai' || value === 'anthropic' || value === 'native') {
      return value
    }
    return undefined
  }

  private normalizeStopSequences(values?: string[]): string[] | undefined {
    if (!values || !Array.isArray(values)) {
      return undefined
    }

    const cleaned = values
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(item => item.length > 0)

    if (cleaned.length === 0) {
      return undefined
    }

    return Array.from(new Set(cleaned))
  }

  private normalizeOptionalText(value?: string): string | undefined {
    if (typeof value !== 'string') {
      return undefined
    }
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
  }
}



