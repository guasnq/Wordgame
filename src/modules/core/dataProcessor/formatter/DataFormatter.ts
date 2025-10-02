/**
 * 数据格式转换工具
 * 修复AI响应中的常见格式问题，字段映射，默认值填充
 *
 * 参考文档：数据流动格式规范.md → 4.1节 轻修补策略
 */

import { ParsedGameData, GameOption, GameStatus, CustomData, StatusFieldValue } from '@/types/game'
import { StatusConfig, ExtensionConfig } from '@/types/config'
import { FieldType, DataType } from '@/types/enums'

export interface FormatOptions {
  data: Partial<ParsedGameData>
  statusConfig: StatusConfig
  extensionConfigs?: ExtensionConfig[]
  enableFieldMapping?: boolean
  enableDefaultFill?: boolean
}

export interface FormatResult {
  success: boolean
  data?: ParsedGameData
  applied: string[]
  warnings: string[]
}

/**
 * 数据格式转换工具类
 */
export class DataFormatter {
  /**
   * 格式化游戏数据
   */
  static format(options: FormatOptions): FormatResult {
    const applied: string[] = []
    const warnings: string[] = []
    let data = { ...options.data }

    // 1. 字段名映射
    if (options.enableFieldMapping !== false) {
      const mapped = this.applyFieldMapping(data)
      data = mapped.data
      applied.push(...mapped.applied)
    }

    // 2. 修复选项格式
    if (data.options) {
      const fixed = this.fixOptionsFormat(data.options)
      data.options = fixed.options
      applied.push(...fixed.applied)
      warnings.push(...fixed.warnings)
    }

    // 3. 修复状态格式
    if (data.status) {
      const fixed = this.fixStatusFormat(data.status, options.statusConfig)
      data.status = fixed.status
      applied.push(...fixed.applied)
      warnings.push(...fixed.warnings)
    }

    // 4. 填充默认值
    if (options.enableDefaultFill !== false) {
      const filled = this.fillDefaults(
        data as ParsedGameData,
        options.statusConfig,
        options.extensionConfigs || []
      )
      data = filled.data
      applied.push(...filled.applied)
    }

    // 检查是否满足最基本的数据结构
    if (!this.isMinimallyValid(data)) {
      return {
        success: false,
        applied,
        warnings: [...warnings, '数据格式化后仍不满足最基本要求']
      }
    }

    return {
      success: true,
      data: data as ParsedGameData,
      applied,
      warnings
    }
  }

  /**
   * 字段名映射
   */
  private static applyFieldMapping(data: Partial<ParsedGameData>): {
    data: Partial<ParsedGameData>
    applied: string[]
  } {
    const applied: string[] = []
    const result = { ...data }

    // 常见的字段名映射
    const fieldMapping: Record<string, string> = {
      event: 'narration',
      事件说明: 'narration',
      事件: 'narration',
      情况说明: 'narration',
      旁白: 'narration',
      description: 'scene',
      场景: 'scene',
      场景描述: 'scene',
      选项: 'options',
      choices: 'options',
      actions: 'options',
      状态: 'status',
      state: 'status',
      自定义: 'custom',
      extension: 'custom',
      extensions: 'custom'
    }

    Object.entries(fieldMapping).forEach(([oldKey, newKey]) => {
      if (oldKey in result && !(newKey in result)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result as any)[newKey] = (result as any)[oldKey]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (result as any)[oldKey]
        applied.push(`字段映射: ${oldKey} → ${newKey}`)
      }
    })

    return { data: result, applied }
  }

  /**
   * 修复选项格式
   */
  private static fixOptionsFormat(options: unknown): {
    options: GameOption[]
    applied: string[]
    warnings: string[]
  } {
    const applied: string[] = []
    const warnings: string[] = []

    if (!Array.isArray(options)) {
      warnings.push('options不是数组类型，无法修复')
      return {
        options: this.getDefaultOptions(),
        applied: ['使用默认选项'],
        warnings
      }
    }

    const fixedOptions: GameOption[] = []
    const validIds = ['A', 'B', 'C']

    options.forEach((option, index) => {
      // 如果选项是字符串，转换为对象
      if (typeof option === 'string') {
        fixedOptions.push({
          id: validIds[index] || 'A',
          text: option,
          description: '',
          enabled: true
        })
        applied.push(`选项${index}从字符串转换为对象`)
        return
      }

      // 如果选项是对象
      if (typeof option === 'object' && option !== null) {
        const opt = option as Record<string, unknown>

        // 修复id字段
        let id = String(opt.id || validIds[index] || 'A')
        if (!validIds.includes(id)) {
          id = validIds[index] || 'A'
          applied.push(`修复选项${index}的id: ${opt.id} → ${id}`)
        }

        // 修复text字段
        const text = String(opt.text || opt.content || opt.description || '继续')
        if (!opt.text) {
          applied.push(`选项${index}缺少text，使用备用字段或默认值`)
        }

        fixedOptions.push({
          id,
          text,
          description: opt.description ? String(opt.description) : '',
          enabled: true
        })
        return
      }

      // 无法修复的选项
      warnings.push(`选项${index}格式无效，使用默认值`)
      fixedOptions.push({
        id: validIds[index] || 'A',
        text: '继续',
        description: '',
        enabled: true
      })
    })

    // 确保有3个选项
    while (fixedOptions.length < 3) {
      const defaultOption = this.getDefaultOptions()[fixedOptions.length]
      fixedOptions.push(defaultOption)
      applied.push(`添加默认选项${fixedOptions.length}`)
    }

    // 如果选项过多，截取前3个
    if (fixedOptions.length > 3) {
      fixedOptions.splice(3)
      warnings.push(`选项数量超过3个，已截取前3个`)
    }

    return { options: fixedOptions, applied, warnings }
  }

  /**
   * 修复状态格式
   */
  private static fixStatusFormat(
    status: unknown,
    statusConfig: StatusConfig
  ): {
    status: GameStatus
    applied: string[]
    warnings: string[]
  } {
    const applied: string[] = []
    const warnings: string[] = []

    if (typeof status !== 'object' || status === null) {
      warnings.push('status不是对象类型，无法修复')
      return {
        status: this.generateDefaultStatus(statusConfig),
        applied: ['使用默认状态'],
        warnings
      }
    }

    const fixedStatus: GameStatus = {}
    const statusObj = status as Record<string, unknown>

    statusConfig.fields.forEach((field) => {
      const value = statusObj[field.name]

      if (value === undefined || value === null) {
        // 字段缺失，使用默认值
        fixedStatus[field.name] = this.getDefaultFieldValue(field)
        applied.push(`状态字段${field.name}缺失，使用默认值`)
        return
      }

      // 修复进度条类型
      if (field.type === FieldType.PROGRESS) {
        if (typeof value === 'number') {
          // 如果是数字，转换为进度条格式
          const config = field.config as { max?: number }
          fixedStatus[field.name] = {
            value: value,
            max: config.max || 100
          }
          applied.push(`状态字段${field.name}从数字转换为进度条格式`)
        } else if (typeof value === 'object') {
          const progressValue = value as Record<string, unknown>
          fixedStatus[field.name] = {
            value:
              typeof progressValue.value === 'number'
                ? progressValue.value
                : typeof progressValue.current === 'number'
                  ? progressValue.current
                  : 0,
            max:
              typeof progressValue.max === 'number'
                ? progressValue.max
                : typeof progressValue.maximum === 'number'
                  ? progressValue.maximum
                  : 100
          }
          if (progressValue.current && !progressValue.value) {
            applied.push(`状态字段${field.name}.current映射到value`)
          }
        } else {
          fixedStatus[field.name] = this.getDefaultFieldValue(field)
          warnings.push(`状态字段${field.name}格式无效，使用默认值`)
        }
      }
      // 修复数值类型
      else if (field.type === FieldType.NUMBER) {
        if (typeof value === 'number') {
          fixedStatus[field.name] = value
        } else if (typeof value === 'string') {
          const parsed = parseFloat(value)
          if (!isNaN(parsed)) {
            fixedStatus[field.name] = parsed
            applied.push(`状态字段${field.name}从字符串转换为数字`)
          } else {
            fixedStatus[field.name] = this.getDefaultFieldValue(field)
            warnings.push(`状态字段${field.name}无法转换为数字，使用默认值`)
          }
        } else {
          fixedStatus[field.name] = this.getDefaultFieldValue(field)
          warnings.push(`状态字段${field.name}格式无效，使用默认值`)
        }
      }
      // 其他类型直接保留
      else {
        fixedStatus[field.name] = value as StatusFieldValue
      }
    })

    return { status: fixedStatus, applied, warnings }
  }

  /**
   * 填充默认值
   */
  private static fillDefaults(
    data: Partial<ParsedGameData>,
    statusConfig: StatusConfig,
    extensionConfigs: ExtensionConfig[]
  ): {
    data: ParsedGameData
    applied: string[]
  } {
    const applied: string[] = []

    // 填充scene
    if (!data.scene || typeof data.scene !== 'string' || data.scene.trim().length === 0) {
      data.scene = '场景描述暂时缺失，请继续游戏。'
      applied.push('填充默认scene')
    }

    // 填充narration
    if (
      !data.narration ||
      typeof data.narration !== 'string' ||
      data.narration.trim().length === 0
    ) {
      data.narration = '当前回合的情况变化暂无描述。'
      applied.push('填充默认narration')
    }

    // 填充options
    if (!data.options || !Array.isArray(data.options) || data.options.length === 0) {
      data.options = this.getDefaultOptions()
      applied.push('填充默认options')
    }

    // 填充status
    if (!data.status) {
      data.status = this.generateDefaultStatus(statusConfig)
      applied.push('填充默认status')
    }

    // 填充custom
    if (!data.custom) {
      data.custom = this.generateDefaultCustom(extensionConfigs)
      if (extensionConfigs.length > 0) {
        applied.push('填充默认custom')
      }
    }

    return { data: data as ParsedGameData, applied }
  }

  /**
   * 获取默认选项
   */
  private static getDefaultOptions(): GameOption[] {
    return [
      { id: 'A', text: '继续', description: '', enabled: true },
      { id: 'B', text: '等待', description: '', enabled: true },
      { id: 'C', text: '返回', description: '', enabled: true }
    ]
  }

  /**
   * 生成默认状态
   */
  private static generateDefaultStatus(statusConfig: StatusConfig): GameStatus {
    const defaultStatus: GameStatus = {}

    statusConfig.fields.forEach((field) => {
      defaultStatus[field.name] = this.getDefaultFieldValue(field)
    })

    return defaultStatus
  }

  /**
   * 获取字段默认值
   */
  private static getDefaultFieldValue(field: { type: string; config: Record<string, unknown> }): StatusFieldValue {
    if (field.type === FieldType.PROGRESS) {
      const config = field.config as { initial?: number; max?: number }
      return {
        value: config.initial || 0,
        max: config.max || 100
      }
    } else if (field.type === FieldType.NUMBER) {
      const config = field.config as { initial?: number }
      return config.initial || 0
    }
    return 0
  }

  /**
   * 生成默认扩展数据
   */
  private static generateDefaultCustom(extensionConfigs: ExtensionConfig[]): CustomData {
    const defaultCustom: CustomData = {}

    extensionConfigs.forEach((config) => {
      if (config.dataType === DataType.ARRAY) {
        defaultCustom[config.name] = []
      } else if (config.dataType === DataType.OBJECT) {
        defaultCustom[config.name] = {}
      } else {
        defaultCustom[config.name] = null
      }
    })

    return defaultCustom
  }

  /**
   * 检查数据是否满足最基本要求
   */
  private static isMinimallyValid(data: Partial<ParsedGameData>): boolean {
    return !!(
      data.scene &&
      typeof data.scene === 'string' &&
      data.narration &&
      typeof data.narration === 'string' &&
      data.options &&
      Array.isArray(data.options) &&
      data.options.length === 3
    )
  }

  /**
   * 智能修复 - 综合应用所有修复策略
   */
  static smartFix(
    data: unknown,
    statusConfig: StatusConfig,
    extensionConfigs?: ExtensionConfig[]
  ): FormatResult {
    // 首先确保是对象
    if (typeof data !== 'object' || data === null) {
      return {
        success: false,
        applied: [],
        warnings: ['数据不是有效的对象类型']
      }
    }

    return this.format({
      data: data as Partial<ParsedGameData>,
      statusConfig,
      extensionConfigs,
      enableFieldMapping: true,
      enableDefaultFill: true
    })
  }
}
