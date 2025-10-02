/**
 * 数据处理引擎统一接口
 * 整合Prompt组装、响应解析、数据验证和格式转换功能
 *
 * 参考文档：数据流动格式规范.md → 4节 网站内部处理
 */

import { PromptBuilder, BuildResult } from './promptBuilder'
import { ResponseParser, ParseResult } from './responseParser'
import { DataValidator, ValidationResult } from './validator'
import { DataFormatter, FormatResult } from './formatter'

import { ParsedGameData } from '@/types/game'
import { WorldConfig, StatusConfig, ExtensionConfig } from '@/types/config'
import { AIProvider } from '@/types/enums'
import { GameState, GameRound } from '@/types/game'

/**
 * 完整处理选项
 */
export interface ProcessOptions {
  // Prompt构建选项
  worldConfig: WorldConfig
  statusConfig: StatusConfig
  extensionConfigs: ExtensionConfig[]
  currentState: GameState
  userInput: string
  historyRounds?: GameRound[]
  maxHistoryRounds?: number

  // 解析选项
  provider: AIProvider
  rawResponse?: string

  // 验证选项
  strictValidation?: boolean

  // 格式化选项
  enableAutoFix?: boolean
  enableFieldMapping?: boolean
  enableDefaultFill?: boolean
}

/**
 * 完整处理结果
 */
export interface ProcessResult {
  success: boolean
  phase: 'prompt' | 'parse' | 'validate' | 'format' | 'complete'

  // 各阶段结果
  prompt?: BuildResult
  parse?: ParseResult
  validation?: ValidationResult
  format?: FormatResult

  // 最终数据
  data?: ParsedGameData

  // 错误信息
  error?: {
    phase: string
    message: string
    details?: unknown
  }

  // 元数据
  metadata?: {
    totalTime: number
    promptTokens?: number
    appliedFixes?: string[]
    warnings?: string[]
  }
}

/**
 * 数据处理引擎类
 */
export class DataProcessor {
  /**
   * 完整的数据处理流程
   * 从用户输入到解析后的游戏数据
   */
  static async processComplete(options: ProcessOptions): Promise<ProcessResult> {
    const startTime = Date.now()
    const result: ProcessResult = {
      success: false,
      phase: 'prompt',
      metadata: {
        totalTime: 0,
        appliedFixes: [],
        warnings: []
      }
    }

    try {
      // 阶段1: 构建Prompt
      const promptResult = this.buildPrompt(options)
      result.prompt = promptResult

      if (!promptResult.success || !promptResult.prompt) {
        result.error = {
          phase: 'prompt',
          message: promptResult.error || '构建Prompt失败',
          details: promptResult
        }
        result.metadata!.totalTime = Date.now() - startTime
        return result
      }

      // 估算token数量
      result.metadata!.promptTokens = PromptBuilder.estimateTokens(promptResult.prompt)

      // 如果没有提供rawResponse，说明只需要构建Prompt
      if (!options.rawResponse) {
        result.success = true
        result.phase = 'prompt'
        result.metadata!.totalTime = Date.now() - startTime
        return result
      }

      // 阶段2: 解析响应
      result.phase = 'parse'
      const parseResult = this.parseResponse({
        provider: options.provider,
        rawResponse: options.rawResponse,
        enableAutoFix: options.enableAutoFix
      })
      result.parse = parseResult

      if (!parseResult.success || !parseResult.data) {
        result.error = {
          phase: 'parse',
          message: parseResult.error?.message || '解析响应失败',
          details: parseResult.error
        }
        result.metadata!.totalTime = Date.now() - startTime
        return result
      }

      let gameData = parseResult.data

      // 阶段3: 格式化数据（自动修复）
      result.phase = 'format'
      const formatResult = this.formatData({
        data: gameData,
        statusConfig: options.statusConfig,
        extensionConfigs: options.extensionConfigs,
        enableFieldMapping: options.enableFieldMapping,
        enableDefaultFill: options.enableDefaultFill
      })
      result.format = formatResult

      if (formatResult.success && formatResult.data) {
        gameData = formatResult.data
        result.metadata!.appliedFixes = formatResult.applied
        result.metadata!.warnings = formatResult.warnings
      }

      // 阶段4: 验证数据
      result.phase = 'validate'
      const validationResult = this.validateData({
        data: gameData,
        statusConfig: options.statusConfig,
        extensionConfigs: options.extensionConfigs,
        strictMode: options.strictValidation
      })
      result.validation = validationResult

      // 收集警告
      if (validationResult.warnings.length > 0) {
        result.metadata!.warnings!.push(
          ...validationResult.warnings.map((w) => w.message)
        )
      }

      // 严格模式下，如果有错误则失败
      if (options.strictValidation && !validationResult.isValid) {
        result.error = {
          phase: 'validate',
          message: '数据验证失败',
          details: validationResult.errors
        }
        result.metadata!.totalTime = Date.now() - startTime
        return result
      }

      // 宽松模式下，只要关键字段有效就算成功
      if (!DataValidator.quickValidate(gameData)) {
        result.error = {
          phase: 'validate',
          message: '数据验证失败：缺少关键字段',
          details: validationResult.errors
        }
        result.metadata!.totalTime = Date.now() - startTime
        return result
      }

      // 阶段5: 完成
      result.phase = 'complete'
      result.success = true
      result.data = gameData
      result.metadata!.totalTime = Date.now() - startTime

      return result
    } catch (error) {
      result.error = {
        phase: result.phase,
        message: error instanceof Error ? error.message : '未知错误',
        details: error
      }
      result.metadata!.totalTime = Date.now() - startTime
      return result
    }
  }

  /**
   * 仅构建Prompt
   */
  static buildPrompt(options: Pick<ProcessOptions,
    'worldConfig' | 'statusConfig' | 'extensionConfigs' | 'currentState' | 'userInput' | 'historyRounds' | 'maxHistoryRounds' | 'provider'
  >): BuildResult {
    return PromptBuilder.buildPrompt({
      worldConfig: options.worldConfig,
      statusConfig: options.statusConfig,
      extensionConfigs: options.extensionConfigs || [],
      currentState: options.currentState,
      userInput: options.userInput,
      historyRounds: options.historyRounds,
      maxHistoryRounds: options.maxHistoryRounds,
      provider: options.provider
    })
  }

  /**
   * 仅解析响应
   */
  static parseResponse(options: {
    provider: AIProvider
    rawResponse: string
    enableAutoFix?: boolean
    strictMode?: boolean
  }): ParseResult {
    return ResponseParser.parseResponse({
      provider: options.provider,
      rawResponse: options.rawResponse,
      enableAutoFix: options.enableAutoFix,
      strictMode: options.strictMode
    })
  }

  /**
   * 仅验证数据
   */
  static validateData(options: {
    data: ParsedGameData
    statusConfig: StatusConfig
    extensionConfigs: ExtensionConfig[]
    strictMode?: boolean
  }): ValidationResult {
    return DataValidator.validate({
      data: options.data,
      statusConfig: options.statusConfig,
      extensionConfigs: options.extensionConfigs || [],
      strictMode: options.strictMode
    })
  }

  /**
   * 仅格式化数据
   */
  static formatData(options: {
    data: Partial<ParsedGameData>
    statusConfig: StatusConfig
    extensionConfigs?: ExtensionConfig[]
    enableFieldMapping?: boolean
    enableDefaultFill?: boolean
  }): FormatResult {
    return DataFormatter.format({
      data: options.data,
      statusConfig: options.statusConfig,
      extensionConfigs: options.extensionConfigs,
      enableFieldMapping: options.enableFieldMapping,
      enableDefaultFill: options.enableDefaultFill
    })
  }

  /**
   * 智能修复数据
   */
  static smartFix(
    data: unknown,
    statusConfig: StatusConfig,
    extensionConfigs?: ExtensionConfig[]
  ): FormatResult {
    return DataFormatter.smartFix(data, statusConfig, extensionConfigs)
  }

  /**
   * 估算Prompt的token数量
   */
  static estimateTokens(prompt: string): number {
    return PromptBuilder.estimateTokens(prompt)
  }

  /**
   * 快速验证数据有效性
   */
  static quickValidate(data: ParsedGameData): boolean {
    return DataValidator.quickValidate(data)
  }
}
