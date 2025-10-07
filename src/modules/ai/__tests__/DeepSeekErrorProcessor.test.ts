import { describe, expect, it } from 'vitest'
import { DeepSeekErrorProcessor } from '../errors/DeepSeekErrorProcessor'
import { ErrorCode } from '@/types/error'
import { ErrorSeverity, RecoveryStrategy } from '@/types/enums'

describe('DeepSeekErrorProcessor', () => {
  it('maps invalid_api_key to unified error', () => {
    const processor = new DeepSeekErrorProcessor()
    const processed = processor.process({
      error: {
        code: 'invalid_api_key',
        message: 'API key invalid',
        status: 401
      },
      request_id: 'req-123'
    })

    expect(processed.code).toBe(ErrorCode.DEEPSEEK_INVALID_API_KEY)
    expect(processed.retryable).toBe(false)
    expect(processed.recovery).toBe(RecoveryStrategy.USER_ACTION)
    expect(processed.severity).toBe(ErrorSeverity.HIGH)
    expect(processed.userMessage).toMatch(/密钥/i)

    const additional = processed.context?.additionalData as Record<string, unknown> | undefined
    expect(additional?.providerCode).toBe('invalid_api_key')
    expect(additional?.providerStatus).toBe(401)
  })

  it('extracts retry information for rate limit errors', () => {
    const processor = new DeepSeekErrorProcessor()
    const processed = processor.process({
      error: {
        code: 'rate_limit_exceeded',
        message: 'Too many requests',
        retry_after: 2
      },
      status: 429
    })

    expect(processed.code).toBe(ErrorCode.DEEPSEEK_RATE_LIMIT_EXCEEDED)
    expect(processed.retryable).toBe(true)
    expect(processed.recovery).toBe(RecoveryStrategy.RETRY)
    expect(processed.userMessage).toMatch(/重试/i)

    const additional = processed.context?.additionalData as Record<string, unknown> | undefined
    expect(additional?.retryAfterSeconds).toBe(2)
  })

  it('falls back to message heuristics for kv cache errors', () => {
    const processor = new DeepSeekErrorProcessor()
    const processed = processor.process(new Error('DeepSeek KV cache error occurred'))

    expect(processed.code).toBe(ErrorCode.DEEPSEEK_CACHE_ERROR)
    expect(processed.retryable).toBe(false)
    expect(processed.recovery).toBe(RecoveryStrategy.FALLBACK)
    expect(processed.userMessage).toMatch(/缓存/i)
  })

  it('handles reasoning mode failures with fallback recovery', () => {
    const processor = new DeepSeekErrorProcessor()
    const processed = processor.process({
      error: {
        code: 'reasoning_mode_failed',
        message: 'Reasoning mode temporarily unavailable'
      }
    })

    expect(processed.code).toBe(ErrorCode.DEEPSEEK_REASONING_FAILED)
    expect(processed.retryable).toBe(false)
    expect(processed.recovery).toBe(RecoveryStrategy.FALLBACK)
    expect(processed.userMessage).toMatch(/推理模式/i)
  })

  it('maps compatibility related errors', () => {
    const processor = new DeepSeekErrorProcessor()
    const processed = processor.process({
      error: {
        code: 'compatibility_mode_failed',
        message: 'Compatibility mode not supported'
      }
    })

    expect(processed.code).toBe(ErrorCode.DEEPSEEK_COMPATIBILITY_ERROR)
    expect(processed.userMessage).toMatch(/兼容/i)
    expect(processed.recovery).toBe(RecoveryStrategy.FALLBACK)
  })

  it('maps token calculation errors', () => {
    const processor = new DeepSeekErrorProcessor()
    const processed = processor.process(new Error('Token calculation error detected'))

    expect(processed.code).toBe(ErrorCode.DEEPSEEK_TOKEN_CALC_ERROR)
    expect(processed.retryable).toBe(true)
    expect(processed.recovery).toBe(RecoveryStrategy.RETRY)
    expect(processed.userMessage).toMatch(/Token/i)
  })
})
