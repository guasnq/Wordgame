import { describe, expect, it } from 'vitest'
import { BaseErrorProcessor, type AdapterProcessedError } from '../errors/BaseErrorProcessor'
import { AIProvider, ErrorCategory, ErrorSeverity, RecoveryStrategy } from '@/types/enums'
import { ErrorCode } from '@/types/error'

class TestErrorProcessor extends BaseErrorProcessor {
  constructor() {
    super({ provider: AIProvider.DEEPSEEK })
  }

  protected getProviderErrorCode(error: unknown, _metadata: ErrorMetadata): ErrorCode | null {
    if (error instanceof Error && error.message.includes('quota')) {
      return ErrorCode.AI_QUOTA_EXCEEDED
    }
    return null
  }
}

describe('BaseErrorProcessor', () => {
  it('uses provider specific mapping when available', () => {
    const processor = new TestErrorProcessor()
    const result = processor.process(new Error('quota reached')) as AdapterProcessedError

    expect(result.code).toBe(ErrorCode.AI_QUOTA_EXCEEDED)
    expect(result.provider).toBe(AIProvider.DEEPSEEK)
    expect(result.recovery).toBe(RecoveryStrategy.USER_ACTION)
    expect(result.retryable).toBe(false)
  })

  it('falls back to default mapping for unknown errors', () => {
    const processor = new TestErrorProcessor()
    const result = processor.process(new Error('unexpected'))

    expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR)
    expect(result.severity).toBe(ErrorSeverity.HIGH)
    expect(result.retryable).toBe(false)
  })

  it('merges metadata overrides', () => {
    const processor = new TestErrorProcessor()
    const result = processor.process(new Error('fatal'), {
      recoveryStrategy: RecoveryStrategy.USER_ACTION,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.AI_SERVICE,
      userMessage: '请检查凭证'
    })

    expect(result.recovery).toBe(RecoveryStrategy.USER_ACTION)
    expect(result.severity).toBe(ErrorSeverity.CRITICAL)
    expect(result.userMessage).toBe('请检查凭证')
  })
})
