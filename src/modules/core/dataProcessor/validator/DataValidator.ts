/**
 * 数据验证器
 * 验证解析后的游戏数据是否符合配置要求
 *
 * 参考文档：数据流动格式规范.md → 4.1节 校验和修复策略
 */

import { ParsedGameData, GameOption, GameStatus, CustomData } from '@/types/game'
import { StatusConfig, ExtensionConfig } from '@/types/config'
import { FieldType, DataType } from '@/types/enums'

export interface ValidationOptions {
  data: ParsedGameData
  statusConfig: StatusConfig
  extensionConfigs: ExtensionConfig[]
  strictMode?: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  metadata?: ValidationMetadata
}

export interface ValidationError {
  field: string
  code: string
  message: string
  severity: 'critical' | 'error' | 'warning'
  value?: unknown
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

export interface ValidationMetadata {
  validationTime: number
  fieldsChecked: number
  errorsFound: number
  warningsFound: number
}

/**
 * 数据验证器类
 */
export class DataValidator {
  /**
   * 验证游戏数据
   */
  static validate(options: ValidationOptions): ValidationResult {
    const startTime = Date.now()
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let fieldsChecked = 0

    // 1. 验证必需字段
    fieldsChecked += this.validateRequiredFields(options.data, errors)

    // 2. 验证scene字段
    fieldsChecked += this.validateScene(options.data.scene, errors, warnings)

    // 3. 验证narration字段
    fieldsChecked += this.validateNarration(options.data.narration, errors, warnings)

    // 4. 验证options字段
    fieldsChecked += this.validateOptions(options.data.options, errors, warnings)

    // 5. 验证status字段
    if (options.data.status) {
      fieldsChecked += this.validateStatus(
        options.data.status,
        options.statusConfig,
        errors,
        warnings
      )
    }

    // 6. 验证custom字段
    if (options.data.custom) {
      fieldsChecked += this.validateCustom(
        options.data.custom,
        options.extensionConfigs,
        errors,
        warnings
      )
    }

    const validationTime = Date.now() - startTime
    const isValid = options.strictMode
      ? errors.length === 0 && warnings.length === 0
      : errors.filter((e) => e.severity === 'critical' || e.severity === 'error').length === 0

    return {
      isValid,
      errors,
      warnings,
      metadata: {
        validationTime,
        fieldsChecked,
        errorsFound: errors.length,
        warningsFound: warnings.length
      }
    }
  }

  /**
   * 验证必需字段
   */
  private static validateRequiredFields(
    data: ParsedGameData,
    errors: ValidationError[]
  ): number {
    const requiredFields = ['scene', 'narration', 'options']
    let checked = 0

    for (const field of requiredFields) {
      checked++
      if (!(field in data)) {
        errors.push({
          field,
          code: 'MISSING_REQUIRED_FIELD',
          message: `缺少必需字段: ${field}`,
          severity: 'critical'
        })
      }
    }

    return checked
  }

  /**
   * 验证scene字段
   */
  private static validateScene(
    scene: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): number {
    if (typeof scene !== 'string') {
      errors.push({
        field: 'scene',
        code: 'INVALID_TYPE',
        message: 'scene字段必须是字符串类型',
        severity: 'error',
        value: scene
      })
      return 1
    }

    if (scene.trim().length === 0) {
      errors.push({
        field: 'scene',
        code: 'EMPTY_VALUE',
        message: 'scene字段不能为空',
        severity: 'error'
      })
    } else if (scene.length < 20) {
      warnings.push({
        field: 'scene',
        message: '场景描述过短，建议增加细节描述',
        suggestion: '场景描述应该包含环境、氛围、视觉细节等信息'
      })
    } else if (scene.length > 1000) {
      warnings.push({
        field: 'scene',
        message: '场景描述过长，可能影响阅读体验',
        suggestion: '建议将场景描述控制在500字以内'
      })
    }

    return 1
  }

  /**
   * 验证narration字段
   */
  private static validateNarration(
    narration: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): number {
    if (typeof narration !== 'string') {
      errors.push({
        field: 'narration',
        code: 'INVALID_TYPE',
        message: 'narration字段必须是字符串类型',
        severity: 'error',
        value: narration
      })
      return 1
    }

    if (narration.trim().length === 0) {
      errors.push({
        field: 'narration',
        code: 'EMPTY_VALUE',
        message: 'narration字段不能为空',
        severity: 'error'
      })
    } else {
      // 检查句子数量（简单判断：按句号、问号、感叹号分割）
      const sentences = narration.split(/[。！？.!?]/).filter((s) => s.trim().length > 0)
      if (sentences.length > 3) {
        warnings.push({
          field: 'narration',
          message: `旁白句子过多（${sentences.length}句），建议控制在1-3句`,
          suggestion: '旁白应该简洁明了，只叙述关键变化'
        })
      }

      if (narration.length > 200) {
        warnings.push({
          field: 'narration',
          message: '旁白文字过长，建议精简',
          suggestion: '旁白应该简短有力，控制在100字以内'
        })
      }
    }

    return 1
  }

  /**
   * 验证options字段
   */
  private static validateOptions(
    options: GameOption[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): number {
    if (!Array.isArray(options)) {
      errors.push({
        field: 'options',
        code: 'INVALID_TYPE',
        message: 'options字段必须是数组类型',
        severity: 'critical',
        value: options
      })
      return 1
    }

    if (options.length !== 3) {
      errors.push({
        field: 'options',
        code: 'INVALID_LENGTH',
        message: `options必须包含3个选项，当前有${options.length}个`,
        severity: 'critical',
        value: options.length
      })
    }

    const validIds = ['A', 'B', 'C']
    const foundIds = new Set<string>()

    options.forEach((option, index) => {
      if (!option || typeof option !== 'object') {
        errors.push({
          field: `options[${index}]`,
          code: 'INVALID_TYPE',
          message: `选项${index}必须是对象类型`,
          severity: 'error',
          value: option
        })
        return
      }

      // 验证id
      if (!option.id) {
        errors.push({
          field: `options[${index}].id`,
          code: 'MISSING_FIELD',
          message: `选项${index}缺少id字段`,
          severity: 'error'
        })
      } else if (!validIds.includes(option.id)) {
        errors.push({
          field: `options[${index}].id`,
          code: 'INVALID_VALUE',
          message: `选项id必须是A、B或C，当前为${option.id}`,
          severity: 'error',
          value: option.id
        })
      } else {
        if (foundIds.has(option.id)) {
          errors.push({
            field: `options[${index}].id`,
            code: 'DUPLICATE_ID',
            message: `选项id重复: ${option.id}`,
            severity: 'error',
            value: option.id
          })
        }
        foundIds.add(option.id)
      }

      // 验证text
      if (!option.text) {
        errors.push({
          field: `options[${index}].text`,
          code: 'MISSING_FIELD',
          message: `选项${index}缺少text字段`,
          severity: 'error'
        })
      } else if (typeof option.text !== 'string') {
        errors.push({
          field: `options[${index}].text`,
          code: 'INVALID_TYPE',
          message: `选项text必须是字符串类型`,
          severity: 'error',
          value: option.text
        })
      } else if (option.text.trim().length === 0) {
        errors.push({
          field: `options[${index}].text`,
          code: 'EMPTY_VALUE',
          message: `选项${index}的文字不能为空`,
          severity: 'error'
        })
      } else if (option.text.length > 50) {
        warnings.push({
          field: `options[${index}].text`,
          message: '选项文字过长，建议精简',
          suggestion: '选项文字应该简洁明了，控制在30字以内'
        })
      }
    })

    return 1
  }

  /**
   * 验证status字段
   */
  private static validateStatus(
    status: GameStatus,
    statusConfig: StatusConfig,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): number {
    let checked = 0

    if (typeof status !== 'object' || status === null) {
      errors.push({
        field: 'status',
        code: 'INVALID_TYPE',
        message: 'status字段必须是对象类型',
        severity: 'error',
        value: status
      })
      return 1
    }

    // 检查配置的字段是否都存在
    for (const field of statusConfig.fields) {
      checked++

      if (!(field.name in status)) {
        if (field.required) {
          errors.push({
            field: `status.${field.name}`,
            code: 'MISSING_FIELD',
            message: `缺少必需的状态字段: ${field.displayName}`,
            severity: 'error'
          })
        } else {
          warnings.push({
            field: `status.${field.name}`,
            message: `缺少可选状态字段: ${field.displayName}`,
            suggestion: '建议补充此字段以保持数据完整性'
          })
        }
        continue
      }

      const value = status[field.name]

      // 验证字段类型
      if (field.type === FieldType.PROGRESS) {
        if (typeof value !== 'object' || value === null) {
          errors.push({
            field: `status.${field.name}`,
            code: 'INVALID_TYPE',
            message: `进度条字段必须是对象类型{value, max}`,
            severity: 'error',
            value
          })
        } else {
          const progressValue = value as { value?: unknown; max?: unknown }
          if (typeof progressValue.value !== 'number') {
            errors.push({
              field: `status.${field.name}.value`,
              code: 'INVALID_TYPE',
              message: '进度条的value必须是数字类型',
              severity: 'error',
              value: progressValue.value
            })
          }
          if (typeof progressValue.max !== 'number') {
            errors.push({
              field: `status.${field.name}.max`,
              code: 'INVALID_TYPE',
              message: '进度条的max必须是数字类型',
              severity: 'error',
              value: progressValue.max
            })
          }
        }
      } else if (field.type === FieldType.NUMBER) {
        if (typeof value !== 'number') {
          errors.push({
            field: `status.${field.name}`,
            code: 'INVALID_TYPE',
            message: `数值字段必须是数字类型`,
            severity: 'error',
            value
          })
        }
      }
    }

    // 检查是否有额外的未配置字段
    for (const key in status) {
      const isConfigured = statusConfig.fields.some((field) => field.name === key)
      if (!isConfigured) {
        warnings.push({
          field: `status.${key}`,
          message: `发现未配置的状态字段: ${key}`,
          suggestion: '建议在状态栏配置中添加此字段，或者从响应中移除'
        })
      }
    }

    return checked
  }

  /**
   * 验证custom字段
   */
  private static validateCustom(
    custom: CustomData,
    extensionConfigs: ExtensionConfig[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): number {
    let checked = 0

    if (typeof custom !== 'object' || custom === null) {
      errors.push({
        field: 'custom',
        code: 'INVALID_TYPE',
        message: 'custom字段必须是对象类型',
        severity: 'error',
        value: custom
      })
      return 1
    }

    // 检查配置的扩展卡片
    for (const config of extensionConfigs) {
      checked++

      if (!(config.name in custom)) {
        warnings.push({
          field: `custom.${config.name}`,
          message: `缺少配置的扩展卡片: ${config.name}`,
          suggestion: '建议在响应中包含所有配置的扩展卡片数据'
        })
        continue
      }

      const value = custom[config.name]

      // 验证数据类型
      if (config.dataType === DataType.ARRAY && !Array.isArray(value)) {
        warnings.push({
          field: `custom.${config.name}`,
          message: `扩展卡片${config.name}配置为数组类型，但实际数据不是数组`,
          suggestion: '建议调整数据格式或修改配置'
        })
      } else if (
        config.dataType === DataType.OBJECT &&
        (typeof value !== 'object' || Array.isArray(value))
      ) {
        warnings.push({
          field: `custom.${config.name}`,
          message: `扩展卡片${config.name}配置为对象类型，但实际数据不是对象`,
          suggestion: '建议调整数据格式或修改配置'
        })
      }
    }

    return checked
  }

  /**
   * 快速验证（只检查关键字段）
   */
  static quickValidate(data: ParsedGameData): boolean {
    return (
      typeof data.scene === 'string' &&
      data.scene.length > 0 &&
      typeof data.narration === 'string' &&
      data.narration.length > 0 &&
      Array.isArray(data.options) &&
      data.options.length === 3 &&
      data.options.every(
        (opt) =>
          opt &&
          typeof opt === 'object' &&
          ['A', 'B', 'C'].includes(opt.id) &&
          typeof opt.text === 'string' &&
          opt.text.length > 0
      )
    )
  }
}
