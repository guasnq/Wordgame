import type { AIResponse, TokenUsage } from '@/types/ai'
import { AIProvider } from '@/types/enums'
import type { RequestExecutionInternalResult } from '../request/BaseRequestHandler'
import { ResponseParser } from '@/modules/core/dataProcessor/responseParser/ResponseParser'

type UnknownRecord = Record<string, unknown>

interface UsageParseResult {
  tokenUsage: TokenUsage
  cacheUsage?: {
    hitTokens: number
    missTokens: number
    writeTokens?: number
  }
  extras?: Record<string, unknown>
}

/**
 * 专用于DeepSeek响应的解析器。
 * 负责从服务端原始payload中提取思考过程、最终JSON文本以及token统计信息。
 */
export class DeepSeekResponseParser {
  static parse(payload: unknown, requestId: string): RequestExecutionInternalResult {
    const record = this.assertRecord(payload)
    const choice = this.selectPrimaryChoice(record)

    const content = this.extractContent(record, choice)
    if (!content) {
      throw this.buildError('未能在DeepSeek响应中找到有效内容', { payload })
    }

    const reasoningSegments = this.extractReasoningSegments(record, choice)
    const reasoningText = reasoningSegments.length > 0 ? reasoningSegments.join('\n').trim() : undefined

    const rawText = this.composeRawText(content, reasoningText)
    if (!rawText.trim()) {
      throw this.buildError('DeepSeek响应内容为空', { payload })
    }

    const parseResult = ResponseParser.parseResponse({
      provider: AIProvider.DEEPSEEK,
      rawResponse: rawText,
      enableAutoFix: true
    })

    if (!parseResult.success || !parseResult.data) {
      throw this.buildError(parseResult.error?.message ?? 'DeepSeek响应解析失败', {
        rawText,
        parseError: parseResult.error
      })
    }

    const usageResult = this.mapUsage(record.usage as UnknownRecord | undefined)
    const compatibilityMode = this.detectCompatibilityMode(record)
    const providerMessageId = typeof record.id === 'string' ? record.id : undefined
    const modelUsed = typeof record.model === 'string' ? record.model : 'deepseek-chat'
    const apiVersion = typeof record.api_version === 'string' ? record.api_version : 'unknown'

    const metadataExtras: Record<string, unknown> = {
      ...(usageResult.extras ?? {})
    }

    if (parseResult.metadata) {
      metadataExtras.extractionMethod = parseResult.metadata.extractionMethod
      metadataExtras.autoFixApplied = parseResult.metadata.autoFixApplied
      metadataExtras.parseTime = parseResult.metadata.parseTime
      metadataExtras.originalLength = parseResult.metadata.originalLength
      metadataExtras.extractedLength = parseResult.metadata.extractedLength
    }

    const response: AIResponse = {
      id: requestId,
      success: true,
      timestamp: Date.now(),
      data: parseResult.data,
      metadata: {
        processingTime: 0,
        tokenUsage: usageResult.tokenUsage,
        modelUsed,
        apiVersion,
        providerMessageId,
        reasoningContent: reasoningText,
        reasoningSegments: reasoningSegments.length ? reasoningSegments : undefined,
        cacheUsage: usageResult.cacheUsage,
        compatibilityMode,
        rawText,
        extras: Object.keys(metadataExtras).length ? metadataExtras : undefined
      }
    }

    const internalMetadata: Record<string, unknown> = {}
    if (reasoningSegments.length) {
      internalMetadata.reasoningSegments = reasoningSegments
    }
    if (compatibilityMode) {
      internalMetadata.compatibilityMode = compatibilityMode
    }
    if (parseResult.metadata) {
      internalMetadata.parseMetadata = parseResult.metadata
    }

    return {
      response,
      rawResponse: payload,
      tokenUsage: usageResult.tokenUsage,
      metadata: Object.keys(internalMetadata).length ? internalMetadata : undefined
    }
  }

  private static composeRawText(content: string, reasoning?: string): string {
    const trimmedContent = content.trim()
    if (!reasoning) {
      return trimmedContent
    }

    const reasoningBlock = reasoning.includes('<reasoning>')
      ? reasoning
      : `<reasoning>\n${reasoning}\n</reasoning>`

    return `${reasoningBlock}\n${trimmedContent}`.trim()
  }

  private static extractContent(
    payload: UnknownRecord,
    choice: UnknownRecord | undefined
  ): string | null {
    const message = this.asRecord(choice?.message)
    const choiceContent = message?.content ?? choice?.content
    const choiceText = choice?.text

    const contentCandidates: Array<string | null> = [
      this.normalizeContent(choiceContent),
      typeof choiceText === 'string' ? choiceText : null,
      this.normalizeContent(payload.output_text),
      this.normalizeContent(payload.content)
    ]

    for (const candidate of contentCandidates) {
      if (candidate && candidate.trim().length > 0) {
        return candidate
      }
    }

    return null
  }

  private static normalizeContent(content: unknown): string | null {
    if (typeof content === 'string') {
      return content
    }

    if (Array.isArray(content)) {
      const segments = content
        .map(item => {
          if (typeof item === 'string') {
            return item
          }
          const record = this.asRecord(item)
          if (!record) {
            return null
          }
          if (typeof record.text === 'string') {
            return record.text
          }
          if (typeof record.content === 'string') {
            return record.content
          }
          return null
        })
        .filter((segment): segment is string => Boolean(segment))

      return segments.length > 0 ? segments.join('\n') : null
    }

    if (typeof content === 'object' && content !== null) {
      const record = content as UnknownRecord
      if (typeof record.text === 'string') {
        return record.text
      }
      if (Array.isArray(record.parts)) {
        return this.normalizeContent(record.parts)
      }
    }

    return null
  }

  private static extractReasoningSegments(
    payload: UnknownRecord,
    choice: UnknownRecord | undefined
  ): string[] {
    const candidates: unknown[] = []

    const choiceMessage = this.asRecord(choice?.message)
    if (Array.isArray(choiceMessage?.reasoning_content)) {
      candidates.push(...(choiceMessage?.reasoning_content as unknown[]))
    }

    if (Array.isArray(choice?.reasoning_content)) {
      candidates.push(...(choice?.reasoning_content as unknown[]))
    }

    if (Array.isArray(payload.reasoning_content)) {
      candidates.push(...(payload.reasoning_content as unknown[]))
    }

    if (typeof payload.reasoning === 'string') {
      candidates.push(payload.reasoning)
    }

    const reasoningStrings = candidates
      .map(item => {
        if (typeof item === 'string') {
          return item
        }
        const record = this.asRecord(item)
        if (!record) {
          return null
        }

        if (typeof record.thought === 'string') {
          return record.thought
        }

        if (typeof record.text === 'string') {
          return record.text
        }

        if (typeof record.content === 'string') {
          return record.content
        }

        return null
      })
      .filter((value): value is string => Boolean(value && value.trim().length > 0))

    return reasoningStrings
  }

  private static mapUsage(usage: UnknownRecord | undefined): UsageParseResult {
    const promptTokens = this.toSafeNumber(
      usage?.prompt_tokens ?? usage?.promptTokens ?? usage?.input_tokens
    )
    const completionTokens = this.toSafeNumber(
      usage?.completion_tokens ?? usage?.completionTokens ?? usage?.output_tokens
    )
    const totalTokensRaw = usage?.total_tokens ?? usage?.totalTokens
    const totalTokens = this.toSafeNumber(totalTokensRaw ?? promptTokens + completionTokens)

    const promptDetails = this.asRecord(usage?.prompt_tokens_details)

    const cacheHitTokens = this.toSafeNumber(
      usage?.cache_read_tokens ??
        usage?.prompt_cache_hit_tokens ??
        usage?.promptTokensCached ??
        promptDetails?.cached_tokens
    )

    const cacheMissTokensCandidate = this.toSafeNumber(
      usage?.cache_miss_tokens ?? usage?.prompt_cache_miss_tokens ?? usage?.promptTokensNotCached
    )

    const cacheWriteTokens = this.toSafeNumber(
      usage?.cache_write_tokens ?? usage?.cache_store_tokens ?? promptDetails?.non_cached_tokens
    )

    const reasoningTokens = this.toSafeNumber(usage?.reasoning_tokens)

    const missTokens =
      cacheMissTokensCandidate > 0
        ? cacheMissTokensCandidate
        : promptTokens > 0 && cacheHitTokens > 0
            ? Math.max(promptTokens - cacheHitTokens, 0)
            : promptTokens || 0

    const cacheUsage =
      cacheHitTokens > 0 || cacheWriteTokens > 0
        ? {
            hitTokens: cacheHitTokens,
            missTokens,
            writeTokens: cacheWriteTokens || undefined
          }
        : undefined

    const tokenUsage: TokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens: totalTokens || promptTokens + completionTokens
    }

    const extras: Record<string, unknown> = {}
    if (reasoningTokens > 0) {
      extras.reasoningTokens = reasoningTokens
    }
    if (usage?.prompt_tokens_details) {
      extras.promptTokensDetails = usage.prompt_tokens_details
    }
    if (usage?.completion_tokens_details) {
      extras.completionTokensDetails = usage.completion_tokens_details
    }
    if (promptDetails && Object.keys(promptDetails).length > 0) {
      extras.promptTokensDetails = promptDetails
    }
    if (usage?.cache_read_tokens !== undefined || usage?.cache_write_tokens !== undefined) {
      extras.cacheTokenBreakdown = {
        read: usage?.cache_read_tokens,
        write: usage?.cache_write_tokens,
        miss: usage?.cache_miss_tokens
      }
    }

    return {
      tokenUsage,
      cacheUsage,
      extras: Object.keys(extras).length ? extras : undefined
    }
  }

  private static detectCompatibilityMode(payload: UnknownRecord): 'openai' | 'anthropic' | 'native' | undefined {
    const explicit = payload.compatibility_mode ?? payload.meta?.compatibility_mode
    if (typeof explicit === 'string') {
      if (explicit === 'openai' || explicit === 'anthropic' || explicit === 'native') {
        return explicit
      }
    }

    const objectType = typeof payload.object === 'string' ? payload.object : ''
    if (objectType.includes('chat.completion')) {
      return 'openai'
    }

    if (payload.anthropic_version || payload.type === 'anthropic_response') {
      return 'anthropic'
    }

    return undefined
  }

  private static selectPrimaryChoice(payload: UnknownRecord): UnknownRecord | undefined {
    if (!Array.isArray(payload.choices)) {
      return undefined
    }

    const [firstValid] = payload.choices.filter(item => typeof item === 'object' && item !== null) as UnknownRecord[]
    return firstValid
  }

  private static assertRecord(value: unknown): UnknownRecord {
    if (!value || typeof value !== 'object') {
      throw this.buildError('DeepSeek响应格式异常，期望对象', { value })
    }
    return value as UnknownRecord
  }

  private static asRecord(value: unknown): UnknownRecord | undefined {
    if (!value || typeof value !== 'object') {
      return undefined
    }
    return value as UnknownRecord
  }

  private static toSafeNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string') {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }

  private static buildError(message: string, details?: Record<string, unknown>): Error {
    const error = new Error(message)
    if (details) {
      (error as Error & { details?: Record<string, unknown> }).details = details
    }
    return error
  }
}
