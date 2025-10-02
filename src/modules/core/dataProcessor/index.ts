/**
 * 数据处理引擎模块统一导出
 *
 * 本模块提供完整的数据处理能力：
 * 1. PromptBuilder - 组装AI请求的Prompt
 * 2. ResponseParser - 解析AI响应
 * 3. DataValidator - 验证数据完整性
 * 4. DataFormatter - 格式化和修复数据
 * 5. DataProcessor - 统一的数据处理接口
 */

// 主处理器
export { DataProcessor } from './DataProcessor'
export type { ProcessOptions, ProcessResult } from './DataProcessor'

// Prompt组装器
export { PromptBuilder } from './promptBuilder'
export type { PromptBuildOptions, BuildResult } from './promptBuilder'

// 响应解析器
export { ResponseParser } from './responseParser'
export type { ParseOptions, ParseResult, ParseError, ParseMetadata } from './responseParser'

// 数据验证器
export { DataValidator } from './validator'
export type {
  ValidationOptions,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationMetadata
} from './validator'

// 数据格式化器
export { DataFormatter } from './formatter'
export type { FormatOptions, FormatResult } from './formatter'
