import type { ConnectionTestResult, DeepSeekConfig } from '@/types/ai'
import { BaseConnectionManager, type ConnectionManagerOptions } from './BaseConnectionManager'

export interface DeepSeekConnectionManagerOptions extends ConnectionManagerOptions {
  fetchImplementation?: typeof fetch
  testEndpoint?: string
}

const API_KEY_PATTERN = /^sk-[A-Za-z0-9]{32,}$/i
const DEFAULT_TEST_ENDPOINT = '/v1/models'

export class DeepSeekConnectionManager extends BaseConnectionManager<DeepSeekConfig> {
  private readonly fetchImpl: typeof fetch
  private readonly testEndpoint: string
  private reasoningSupported = false
  private reasoningEnabled = false
  private desiredReasoningMode?: boolean

  constructor(options: DeepSeekConnectionManagerOptions = {}) {
    const { fetchImplementation, testEndpoint, ...baseOptions } = options
    super(baseOptions)

    const runtimeFetch = fetchImplementation ?? (globalThis as { fetch?: typeof fetch }).fetch
    if (!runtimeFetch) {
      throw new Error('当前运行环境缺少 fetch 实现，无法连接DeepSeek API')
    }

    this.fetchImpl = runtimeFetch
    this.testEndpoint = testEndpoint ?? DEFAULT_TEST_ENDPOINT
  }

  setReasoningMode(enabled: boolean): void {
    this.desiredReasoningMode = enabled

    if (!this.currentConfig) {
      this.reasoningEnabled = enabled
      return
    }

    if (enabled && (!this.currentConfig.supportReasoning || !this.reasoningSupported)) {
      throw new Error('当前DeepSeek配置不支持推理模式')
    }

    this.reasoningEnabled = enabled && this.reasoningSupported
  }

  isReasoningModeEnabled(): boolean {
    return this.reasoningEnabled
  }

  isReasoningModeSupported(): boolean {
    return this.reasoningSupported
  }

  protected override validateConfig(config: DeepSeekConfig): void {
    super.validateConfig(config)
    this.assertApiKey(config.apiKey)

    if (!/^https?:\/\//i.test(config.apiUrl)) {
      throw new Error('DeepSeek API地址必须以http或https开头')
    }
  }

  protected override async establishConnection(config: DeepSeekConfig): Promise<void> {
    const metadata = await this.fetchServiceMetadata(config)
    this.reasoningSupported = config.supportReasoning && metadata.models.includes('deepseek-reasoner')
    const desired = this.desiredReasoningMode ?? config.reasoningModeEnabled ?? false
    this.reasoningEnabled = this.reasoningSupported && desired
  }

  protected override async terminateConnection(): Promise<void> {
    // DeepSeek目前使用短连接，无需额外清理
  }

  protected override async performConnectionTest(config: DeepSeekConfig): Promise<ConnectionTestResult> {
    const start = this.getTimestamp()
    const metadata = await this.fetchServiceMetadata(config)
    const latency = this.getTimestamp() - start

    if (this.currentConfig && this.isSameConfig(config)) {
      this.reasoningSupported = config.supportReasoning && metadata.models.includes('deepseek-reasoner')
      if (this.desiredReasoningMode !== undefined) {
        this.reasoningEnabled = this.reasoningSupported && this.desiredReasoningMode
      }
    }

    return {
      success: true,
      responseTime: latency,
      details: {
        apiVersion: metadata.apiVersion,
        modelAvailable: metadata.models.includes(config.model),
        features: this.collectFeatures(config, metadata.models)
      }
    }
  }

  private isSameConfig(config: DeepSeekConfig): boolean {
    return (
      !!this.currentConfig &&
      this.currentConfig.apiUrl === config.apiUrl &&
      this.currentConfig.apiKey === config.apiKey
    )
  }

  private async fetchServiceMetadata(config: DeepSeekConfig): Promise<{ models: string[]; apiVersion?: string }> {
    let response: Response
    try {
      response = await this.fetchImpl(this.buildEndpoint(config.apiUrl), {
        method: 'GET',
        headers: this.buildHeaders(config)
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`无法连接DeepSeek服务：${message}`)
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error('DeepSeek API密钥无效或无访问权限')
    }

    if (!response.ok) {
      throw new Error(`DeepSeek服务返回异常：${response.status} ${response.statusText}`.trim())
    }

    let payload: any = {}
    try {
      payload = await response.json()
    } catch {
      payload = {}
    }

    const list = Array.isArray(payload?.data) ? payload.data : []
    const models = list
      .map((item: any) => item?.id)
      .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
    const apiVersion = payload?.meta?.version ?? payload?.api_version ?? undefined

    return { models, apiVersion }
  }

  private buildHeaders(config: DeepSeekConfig): Record<string, string> {
    return {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'WordGame-Renderer/1.0'
    }
  }

  private buildEndpoint(baseUrl: string): string {
    const sanitizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    const sanitizedPath = this.testEndpoint.startsWith('/') ? this.testEndpoint : `/${this.testEndpoint}`
    return `${sanitizedBase}${sanitizedPath}`
  }

  private assertApiKey(key: string): void {
    const normalized = key.trim()
    if (!normalized) {
      throw new Error('DeepSeek API密钥不能为空')
    }

    if (!API_KEY_PATTERN.test(normalized)) {
      throw new Error('DeepSeek API密钥格式不正确')
    }
  }

  private collectFeatures(config: DeepSeekConfig, models: string[]): string[] {
    const features = new Set<string>()
    features.add(`compat:${config.compatibilityMode}`)
    if (config.enableCache) {
      features.add('kv_cache')
    }

    if (models.includes('deepseek-reasoner')) {
      features.add(this.reasoningEnabled ? 'reasoning:on' : 'reasoning:available')
    } else {
      features.add('reasoning:unavailable')
    }

    return Array.from(features)
  }
}