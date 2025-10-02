/**
 * AI响应解析器
 * 解析AI返回的原始响应，提取和解析JSON数据
 *
 * 参考文档：数据流动格式规范.md → 4.1节 AI响应解析处理
 */

import { ParsedGameData } from '@/types/game'
import { AIProvider } from '@/types/enums'

export interface ParseOptions {
  provider: AIProvider
  rawResponse: string
  enableAutoFix?: boolean
  strictMode?: boolean
}

export interface ParseResult {
  success: boolean
  data?: ParsedGameData
  error?: ParseError
  metadata?: ParseMetadata
}

export interface ParseError {
  code: string
  message: string
  phase: 'extraction' | 'parsing' | 'validation'
  rawContent?: string
}

export interface ParseMetadata {
  extractionMethod: string
  autoFixApplied: boolean
  parseTime: number
  originalLength: number
  extractedLength: number
}

/**
 * AI响应解析器类
 */
export class ResponseParser {
  /**
   * 解析AI响应
   */
  static parseResponse(options: ParseOptions): ParseResult {
    const startTime = Date.now()

    try {
      // 步骤1：提取JSON
      const extraction = this.extractJSON(options.rawResponse, options.provider)
      if (!extraction.success) {
        return {
          success: false,
          error: {
            code: 'EXTRACTION_FAILED',
            message: extraction.error || '无法提取JSON内容',
            phase: 'extraction',
            rawContent: options.rawResponse
          }
        }
      }

      // 步骤2：解析JSON
      let parsedData: unknown
      try {
        parsedData = JSON.parse(extraction.jsonText!)
      } catch (parseError) {
        // 如果启用自动修复，尝试修复
        if (options.enableAutoFix) {
          const fixed = this.tryFixJSON(extraction.jsonText!)
          if (fixed) {
            parsedData = JSON.parse(fixed)
          } else {
            return {
              success: false,
              error: {
                code: 'PARSE_FAILED',
                message: parseError instanceof Error ? parseError.message : 'JSON解析失败',
                phase: 'parsing',
                rawContent: extraction.jsonText
              }
            }
          }
        } else {
          return {
            success: false,
            error: {
              code: 'PARSE_FAILED',
              message: parseError instanceof Error ? parseError.message : 'JSON解析失败',
              phase: 'parsing',
              rawContent: extraction.jsonText
            }
          }
        }
      }

      // 步骤3：验证数据结构
      if (!this.isValidGameData(parsedData)) {
        return {
          success: false,
          error: {
            code: 'INVALID_STRUCTURE',
            message: '解析后的数据结构不符合要求',
            phase: 'validation',
            rawContent: JSON.stringify(parsedData)
          }
        }
      }

      const parseTime = Date.now() - startTime

      return {
        success: true,
        data: parsedData as ParsedGameData,
        metadata: {
          extractionMethod: extraction.method!,
          autoFixApplied: extraction.autoFixed || false,
          parseTime,
          originalLength: options.rawResponse.length,
          extractedLength: extraction.jsonText!.length
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : '未知错误',
          phase: 'parsing'
        }
      }
    }
  }

  /**
   * 提取JSON内容
   */
  private static extractJSON(
    text: string,
    provider: AIProvider
  ): {
    success: boolean
    jsonText?: string
    method?: string
    error?: string
    autoFixed?: boolean
  } {
    // 策略1：提取markdown包裹的JSON
    const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
    if (markdownMatch) {
      return {
        success: true,
        jsonText: markdownMatch[1].trim(),
        method: 'markdown'
      }
    }

    // 策略2：提取通用代码块
    const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      const content = codeBlockMatch[1].trim()
      // 检查是否是JSON
      if (content.startsWith('{') || content.startsWith('[')) {
        return {
          success: true,
          jsonText: content,
          method: 'codeblock'
        }
      }
    }

    // 策略3：处理DeepSeek推理模式的特殊格式
    if (provider === AIProvider.DEEPSEEK) {
      // 移除推理标签
      const withoutReasoning = text.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '')
      return this.extractJSONBraces(withoutReasoning, 'deepseek-reasoning')
    }

    // 策略4：处理Gemini安全过滤响应
    if (provider === AIProvider.GEMINI) {
      try {
        const parsed = JSON.parse(text)
        if (parsed.candidates && parsed.candidates.length > 0) {
          const content = parsed.candidates[0].content.parts[0].text
          return this.extractJSON(content, provider)
        }
        if (parsed.promptFeedback && parsed.promptFeedback.blockReason) {
          return {
            success: false,
            error: `Gemini安全过滤: ${parsed.promptFeedback.blockReason}`
          }
        }
      } catch {
        // 如果不是Gemini格式，继续下一个策略
      }
    }

    // 策略5：处理SiliconFlow批处理响应
    if (provider === AIProvider.SILICONFLOW) {
      try {
        const parsed = JSON.parse(text)
        if (parsed.results && Array.isArray(parsed.results) && parsed.results.length > 0) {
          return {
            success: true,
            jsonText: JSON.stringify(parsed.results[0]),
            method: 'siliconflow-batch'
          }
        }
      } catch {
        // 如果不是SiliconFlow格式，继续下一个策略
      }
    }

    // 策略6：提取第一个完整的JSON对象
    return this.extractJSONBraces(text, 'braces')
  }

  /**
   * 通过大括号匹配提取JSON
   */
  private static extractJSONBraces(
    text: string,
    method: string
  ): {
    success: boolean
    jsonText?: string
    method?: string
    error?: string
  } {
    const start = text.indexOf('{')
    if (start === -1) {
      return {
        success: false,
        error: '未找到JSON对象起始标记'
      }
    }

    let braceCount = 0
    let end = start

    for (let i = start; i < text.length; i++) {
      if (text[i] === '{') braceCount++
      if (text[i] === '}') braceCount--

      if (braceCount === 0) {
        end = i + 1
        break
      }
    }

    if (braceCount !== 0) {
      return {
        success: false,
        error: 'JSON对象不完整（括号不匹配）'
      }
    }

    return {
      success: true,
      jsonText: text.substring(start, end),
      method
    }
  }

  /**
   * 尝试修复常见的JSON错误
   */
  private static tryFixJSON(jsonText: string): string | null {
    try {
      // 修复1：移除末尾多余的逗号
      let fixed = jsonText.replace(/,(\s*[}\]])/g, '$1')

      // 修复2：替换单引号为双引号
      fixed = fixed.replace(/'/g, '"')

      // 修复3：移除注释
      fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '')
      fixed = fixed.replace(/\/\/.*/g, '')

      // 修复4：修复未加引号的键名
      fixed = fixed.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')

      // 验证修复后的JSON是否有效
      JSON.parse(fixed)
      return fixed
    } catch {
      return null
    }
  }

  /**
   * 验证解析后的数据是否符合游戏数据结构
   */
  private static isValidGameData(data: unknown): data is ParsedGameData {
    if (!data || typeof data !== 'object') {
      return false
    }

    const obj = data as Record<string, unknown>

    // 检查必需字段
    if (!obj.scene || typeof obj.scene !== 'string') {
      return false
    }

    if (!obj.narration || typeof obj.narration !== 'string') {
      return false
    }

    if (!Array.isArray(obj.options) || obj.options.length !== 3) {
      return false
    }

    // 检查选项格式
    for (const option of obj.options) {
      if (!option || typeof option !== 'object') {
        return false
      }
      const opt = option as Record<string, unknown>
      if (!opt.id || !opt.text) {
        return false
      }
      if (!['A', 'B', 'C'].includes(String(opt.id))) {
        return false
      }
    }

    // status和custom字段可选，但如果存在必须是对象
    if (obj.status !== undefined && typeof obj.status !== 'object') {
      return false
    }

    if (obj.custom !== undefined && typeof obj.custom !== 'object') {
      return false
    }

    return true
  }

  /**
   * 从OpenAI格式的响应中提取内容
   */
  static extractFromOpenAIFormat(response: unknown): string | null {
    try {
      const obj = response as Record<string, unknown>
      if (obj.choices && Array.isArray(obj.choices) && obj.choices.length > 0) {
        const choice = obj.choices[0] as Record<string, unknown>
        if (choice.message && typeof choice.message === 'object') {
          const message = choice.message as Record<string, unknown>
          if (message.content && typeof message.content === 'string') {
            return message.content
          }
        }
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * 从Gemini格式的响应中提取内容
   */
  static extractFromGeminiFormat(response: unknown): string | null {
    try {
      const obj = response as Record<string, unknown>
      if (obj.candidates && Array.isArray(obj.candidates) && obj.candidates.length > 0) {
        const candidate = obj.candidates[0] as Record<string, unknown>
        if (candidate.content && typeof candidate.content === 'object') {
          const content = candidate.content as Record<string, unknown>
          if (content.parts && Array.isArray(content.parts) && content.parts.length > 0) {
            const part = content.parts[0] as Record<string, unknown>
            if (part.text && typeof part.text === 'string') {
              return part.text
            }
          }
        }
      }
      return null
    } catch {
      return null
    }
  }
}
