import { describe, expect, it } from 'vitest'
import { DeepSeekResponseParser } from '../response/DeepSeekResponseParser'

function createGamePayload() {
  return {
    scene: '你来到幽暗的森林入口，空气中弥漫着潮湿与泥土的气味。',
    narration: '树叶沙沙作响，你感觉前方似乎隐藏着什么未知的秘密。',
    options: [
      { id: 'A', text: '举起火把继续前进' },
      { id: 'B', text: '停下来仔细观察周围' },
      { id: 'C', text: '选择原路返回' }
    ],
    status: {
      health: { value: 85, max: 100 }
    },
    custom: {
      背包: ['火把', '绷带']
    }
  }
}

describe('DeepSeekResponseParser', () => {
  it('parses standard DeepSeek response', () => {
    const json = JSON.stringify(createGamePayload(), null, 2)
    const payload = {
      id: 'resp-123',
      model: 'deepseek-chat',
      api_version: '2024-08-20',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: json
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 150,
        completion_tokens: 200,
        total_tokens: 350
      }
    }

    const result = DeepSeekResponseParser.parse(payload, 'req-1')

    expect(result.response.id).toBe('req-1')
    expect(result.response.success).toBe(true)
    expect(result.response.data).toEqual(createGamePayload())
    expect(result.response.metadata.modelUsed).toBe('deepseek-chat')
    expect(result.response.metadata.apiVersion).toBe('2024-08-20')
    expect(result.response.metadata.providerMessageId).toBe('resp-123')
    expect(result.response.metadata.rawText?.trim()).toBe(json.trim())
    expect(result.response.metadata.reasoningContent).toBeUndefined()
    expect(result.tokenUsage).toEqual({
      promptTokens: 150,
      completionTokens: 200,
      totalTokens: 350
    })
  })

  it('handles reasoning content and wraps it in raw output', () => {
    const json = JSON.stringify(createGamePayload(), null, 2)
    const payload = {
      id: 'resp-456',
      model: 'deepseek-reasoner',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: json,
            reasoning_content: [
              { type: 'reasoning', text: '分析场景风险并评估玩家状态。' },
              { type: 'reasoning', text: '选择三个行动选项以保持节奏。' }
            ]
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 220,
        completion_tokens: 240,
        total_tokens: 460,
        cache_read_tokens: 120,
        cache_miss_tokens: 100,
        reasoning_tokens: 80
      }
    }

    const result = DeepSeekResponseParser.parse(payload, 'req-2')
    const metadata = result.response.metadata

    expect(metadata.reasoningSegments).toHaveLength(2)
    expect(metadata.reasoningContent).toContain('分析场景风险并评估玩家状态')
    expect(metadata.rawText).toMatch(/^<reasoning>/)
    expect(metadata.cacheUsage?.hitTokens).toBe(120)
    expect(metadata.cacheUsage?.missTokens).toBe(100)
    expect(metadata.extras?.reasoningTokens).toBe(80)
  })

  it('detects OpenAI compatibility mode when object indicates chat.completion', () => {
    const json = JSON.stringify(createGamePayload())
    const payload = {
      object: 'chat.completion',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: [
              { type: 'text', text: json }
            ]
          }
        }
      ],
      usage: {
        prompt_tokens: 180,
        completion_tokens: 210
      }
    }

    const result = DeepSeekResponseParser.parse(payload, 'req-3')

    expect(result.response.metadata.compatibilityMode).toBe('openai')
    expect(result.response.metadata.rawText).toContain(json)
  })

  it('calculates cache usage when cache tokens are provided', () => {
    const json = JSON.stringify(createGamePayload())
    const payload = {
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: json
          }
        }
      ],
      usage: {
        prompt_tokens: 400,
        completion_tokens: 100,
        cache_read_tokens: 250,
        cache_write_tokens: 50,
        cache_miss_tokens: 150,
        total_tokens: 500
      }
    }

    const result = DeepSeekResponseParser.parse(payload, 'req-4')
    const cacheUsage = result.response.metadata.cacheUsage

    expect(cacheUsage).toEqual({
      hitTokens: 250,
      missTokens: 150,
      writeTokens: 50
    })
    expect(result.tokenUsage.totalTokens).toBe(500)
  })

  it('throws helpful error when content cannot be extracted', () => {
    const payload = {
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant'
          }
        }
      ]
    }

    expect(() => DeepSeekResponseParser.parse(payload, 'req-err')).toThrow(/未能在DeepSeek响应中找到有效内容/)
  })
})
