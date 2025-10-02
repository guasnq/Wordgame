/**
 * Prompt组装器
 * 根据用户输入、游戏状态、配置等信息组装完整的AI Prompt
 *
 * 参考文档：数据流动格式规范.md → 2.1节 完整的Prompt格式
 */

import { WorldConfig, StatusConfig, ExtensionConfig } from '@/types/config'
import { GameState, GameRound, CustomData, StatusFieldValue, ProgressValue } from '@/types/game'
import { AIProvider, FieldType, DataType } from '@/types/enums'

export interface PromptBuildOptions {
  worldConfig: WorldConfig
  statusConfig: StatusConfig
  extensionConfigs: ExtensionConfig[]
  currentState: GameState
  userInput: string
  historyRounds?: GameRound[]
  maxHistoryRounds?: number
  provider?: AIProvider  // AI服务商类型
}

export interface BuildResult {
  success: boolean
  prompt?: string
  error?: string
  metadata?: {
    totalLength: number
    sections: Record<string, number>
  }
}

/**
 * Prompt组装器类
 */
export class PromptBuilder {
  /**
   * 构建完整的Prompt
   */
  static buildPrompt(options: PromptBuildOptions): BuildResult {
    try {
      const sections: string[] = []
      const sectionLengths: Record<string, number> = {}

      // 1. 游戏世界观
      const worldSection = this.buildWorldSection(options.worldConfig)
      sections.push(worldSection)
      sectionLengths['world'] = worldSection.length

      // 2. 角色背景
      const characterSection = this.buildCharacterSection(options.worldConfig)
      sections.push(characterSection)
      sectionLengths['character'] = characterSection.length

      // 3. 历史回合摘要（如果有）
      if (options.historyRounds && options.historyRounds.length > 0) {
        const historySection = this.buildHistorySection(
          options.historyRounds,
          options.maxHistoryRounds || 10
        )
        sections.push(historySection)
        sectionLengths['history'] = historySection.length
      }

      // 4. 当前角色状态
      const statusSection = this.buildStatusSection(
        options.currentState.playerStatus,
        options.statusConfig
      )
      sections.push(statusSection)
      sectionLengths['status'] = statusSection.length

      // 5. 当前扩展信息（如果有）
      if (Object.keys(options.currentState.customData).length > 0) {
        const extensionSection = this.buildExtensionSection(
          options.currentState.customData,
          options.extensionConfigs
        )
        sections.push(extensionSection)
        sectionLengths['extension'] = extensionSection.length
      }

      // 6. 玩家当前操作
      const inputSection = this.buildInputSection(options.userInput)
      sections.push(inputSection)
      sectionLengths['input'] = inputSection.length

      // 7. 输出要求
      const requirementSection = this.buildRequirementSection(
        options.statusConfig,
        options.extensionConfigs,
        options.provider
      )
      sections.push(requirementSection)
      sectionLengths['requirement'] = requirementSection.length

      // 组合所有sections
      const prompt = sections.join('\n\n')

      return {
        success: true,
        prompt,
        metadata: {
          totalLength: prompt.length,
          sections: sectionLengths
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '构建Prompt失败'
      }
    }
  }

  /**
   * 构建世界观部分
   */
  private static buildWorldSection(worldConfig: WorldConfig): string {
    return `=== 游戏世界观 ===
${worldConfig.background}

${worldConfig.rules ? `游戏规则：\n${worldConfig.rules}` : ''}`
  }

  /**
   * 构建角色背景部分
   */
  private static buildCharacterSection(worldConfig: WorldConfig): string {
    return `=== 角色背景 ===
${worldConfig.characters || '玩家是一名普通的冒险者'}`
  }

  /**
   * 构建历史回合摘要
   */
  private static buildHistorySection(
    historyRounds: GameRound[],
    maxRounds: number
  ): string {
    // 只保留最近的N个回合
    const recentRounds = historyRounds.slice(-maxRounds)

    const summaries = recentRounds.map((round) => {
      const userAction = round.userInput?.content || '（系统回合）'
      const narration = round.aiResponse.narration
      return `第${round.round}回合：${userAction} - ${narration}`
    })

    return `=== 历史回合摘要 ===
${summaries.join('\n')}`
  }

  /**
   * 构建当前状态部分
   */
  private static buildStatusSection(
    playerStatus: Record<string, StatusFieldValue>,
    statusConfig: StatusConfig
  ): string {
    const statusLines: string[] = []

    // 按配置的字段顺序输出
    statusConfig.fields.forEach((field) => {
      const value = playerStatus[field.name]
      if (value !== undefined) {
        const formattedValue = this.formatStatusValue(value)
        statusLines.push(`${field.displayName}: ${formattedValue}`)
      }
    })

    return `=== 当前角色状态 ===
${statusLines.join('\n')}`
  }

  /**
   * 格式化状态值
   */
  private static formatStatusValue(value: StatusFieldValue): string {
    if (typeof value === 'number') {
      return String(value)
    }

    if (typeof value === 'object' && value !== null && 'value' in value) {
      const progressValue = value as ProgressValue
      return `${progressValue.value}/${progressValue.max}`
    }

    return String(value)
  }

  /**
   * 构建扩展信息部分
   */
  private static buildExtensionSection(
    customData: CustomData,
    extensionConfigs: ExtensionConfig[]
  ): string {
    const extensionLines: string[] = []

    // 遍历所有扩展配置
    extensionConfigs.forEach((config) => {
      const data = customData[config.name]
      if (data !== undefined) {
        const formattedData = this.formatExtensionData(data)
        extensionLines.push(`${config.name}: ${formattedData}`)
      }
    })

    // 处理未配置的额外数据
    if (customData._extra) {
      Object.entries(customData._extra).forEach(([key, value]) => {
        const formattedData = this.formatExtensionData(value)
        extensionLines.push(`${key}: ${formattedData}`)
      })
    }

    return `=== 当前扩展信息 ===
${extensionLines.join('\n')}`
  }

  /**
   * 格式化扩展数据
   */
  private static formatExtensionData(data: unknown): string {
    if (Array.isArray(data)) {
      return data.join(', ')
    }

    if (typeof data === 'object' && data !== null) {
      return Object.entries(data)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    }

    return String(data)
  }

  /**
   * 构建用户输入部分
   */
  private static buildInputSection(userInput: string): string {
    return `=== 玩家当前操作 ===
${userInput}`
  }

  /**
   * 构建输出要求部分
   */
  private static buildRequirementSection(
    statusConfig: StatusConfig,
    extensionConfigs: ExtensionConfig[],
    provider?: AIProvider
  ): string {
    // 构建状态字段示例
    const statusExample = this.buildStatusExample(statusConfig)

    // 构建扩展字段示例
    const extensionExample = this.buildExtensionExample(extensionConfigs)

    // 根据不同AI服务商添加特定说明
    const providerSpecificNotes = this.buildProviderSpecificNotes(provider)

    return `=== 输出要求 ===
请必须严格按照以下JSON格式输出，内容使用自然语言描述：

\`\`\`json
{
  "scene": "场景的详细自然语言描述，包含环境、氛围、视觉细节等",
  "narration": "旁白内容——以第三人称视角叙述当前回合的情况变化（限制1-3句话）",
  "options": [
    {"id": "A", "text": "选项A的具体行动描述"},
    {"id": "B", "text": "选项B的具体行动描述"},
    {"id": "C", "text": "选项C的具体行动描述"}
  ],
  "status": ${statusExample},
  "custom": ${extensionExample}
}
\`\`\`

关键要求：
1. JSON必须完整且格式正确，不能有多余的逗号
2. 内容使用生动的自然语言，但结构要固定
3. options必须提供3个，id固定为A、B、C，不可省略或增加
4. status字段必须与用户配置的状态栏字段完全一致，进度条类型使用{value,max}对象格式
5. custom中的key优先使用系统配置的扩展卡片名称
6. 所有数值必须是数字类型，不要用字符串
7. 请勿使用"event"字段，必须使用"narration"
8. narration必须限制在1-3句话，保持简洁明了${providerSpecificNotes}`
  }

  /**
   * 根据AI服务商构建特定说明
   */
  private static buildProviderSpecificNotes(provider?: AIProvider): string {
    if (!provider) {
      return ''
    }

    switch (provider) {
      case AIProvider.DEEPSEEK:
        return `

特别说明（DeepSeek）：
- 如果使用推理模式，请在思考后直接输出JSON，不要添加额外说明
- 支持在JSON前添加<reasoning>标签包裹的思考过程，但最终必须输出完整JSON
- 请确保JSON格式严格符合要求，不要使用Markdown格式的额外包装`

      case AIProvider.GEMINI:
        return `

特别说明（Gemini）：
- 请确保输出内容符合安全政策，避免触发安全过滤器
- 如果内容涉及敏感话题，请使用委婉的表达方式
- 必须直接输出JSON格式，不要添加前缀或后缀说明
- 支持多模态输入，但输出必须是纯文本JSON格式`

      case AIProvider.SILICONFLOW:
        return `

特别说明（SiliconFlow）：
- 请直接输出JSON格式，不要添加任何前后说明文字
- 确保JSON格式严格有效，避免解析错误
- 如果使用批处理模式，每个请求都应独立输出完整JSON
- 输出应该简洁高效，避免冗长描述`

      default:
        return ''
    }
  }

  /**
   * 构建状态字段示例
   */
  private static buildStatusExample(statusConfig: StatusConfig): string {
    const examples: Record<string, unknown> = {}

    statusConfig.fields.forEach((field) => {
      if (field.type === FieldType.PROGRESS) {
        examples[field.name] = { value: 100, max: 100 }
      } else if (field.type === FieldType.NUMBER) {
        examples[field.name] = 0
      } else {
        examples[field.name] = 'value'
      }
    })

    return JSON.stringify(examples, null, 2).split('\n').map(line => '  ' + line).join('\n').trim()
  }

  /**
   * 构建扩展字段示例
   */
  private static buildExtensionExample(extensionConfigs: ExtensionConfig[]): string {
    const examples: Record<string, unknown> = {}

    extensionConfigs.forEach((config) => {
      if (config.dataType === DataType.ARRAY) {
        examples[config.name] = ['item1', 'item2']
      } else if (config.dataType === DataType.OBJECT) {
        examples[config.name] = { key1: 'value1', key2: 'value2' }
      } else {
        examples[config.name] = 'mixed data'
      }
    })

    return JSON.stringify(examples, null, 2).split('\n').map(line => '  ' + line).join('\n').trim()
  }

  /**
   * 估算Prompt的token数量（粗略估算：1 token ≈ 2-3个字符）
   */
  static estimateTokens(prompt: string): number {
    // 中文字符按2.5个字符=1 token计算
    // 英文按4个字符=1 token计算
    const chineseChars = (prompt.match(/[\u4e00-\u9fa5]/g) || []).length
    const otherChars = prompt.length - chineseChars

    return Math.ceil(chineseChars / 2.5 + otherChars / 4)
  }
}
