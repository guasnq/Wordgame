import { gameEventBus, gameEventHelpers } from './gameEventHelpers'
import { useGameStore } from '@/stores/gameStore'
import { mockRounds, getRandomMockData, getRandomScene, getRandomNarration, getRandomOptions } from '@/constants/mockData'
import type { GameOption, GameRound } from '@/stores/gameStore'
import type { StatusItem, Quest, Relationship } from '@/types/game'

// Mock API响应接口
export interface MockApiResponse {
  success: boolean
  data?: MockAIResponse
  error?: string
  delay?: number
}

// Mock AI响应数据结构
export interface MockAIResponse {
  scene: string
  narration: string
  options: GameOption[]
  status: StatusItem[]
  custom?: MockAICustomPayload
}

type InventoryRecord = {
  name: string
  count: number
  description?: string
}

type MockAICustomPayload = {
  quests?: Quest[]
  relationships?: Relationship[]
  inventory?: InventoryRecord[]
  cards?: Record<string, unknown>
}

// Mock API类
class MockApi {
  private isEnabled = true
  private defaultDelay = 1000 // 默认延迟1秒模拟网络请求
  private errorRate = 0.1 // 10% 错误率用于测试错误处理
  private currentRoundIndex = 0

  // 启用/禁用Mock API
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    console.log(`[MockAPI] ${enabled ? 'Enabled' : 'Disabled'}`)
  }

  // 设置延迟时间
  setDelay(delay: number): void {
    this.defaultDelay = delay
  }

  // 设置错误率
  setErrorRate(rate: number): void {
    this.errorRate = Math.max(0, Math.min(1, rate))
  }

  // 模拟网络延迟
  private async delay(ms?: number): Promise<void> {
    const delayTime = ms || this.defaultDelay
    return new Promise(resolve => setTimeout(resolve, delayTime))
  }

  // 模拟错误
  private shouldSimulateError(): boolean {
    return Math.random() < this.errorRate
  }

  // 模拟AI请求 - 处理用户选项
  async processUserOption(optionId: 'A' | 'B' | 'C', optionText: string): Promise<MockApiResponse> {
    if (!this.isEnabled) {
      return { success: false, error: 'Mock API is disabled' }
    }

    // 发射请求开始事件
    gameEventHelpers.emitAIRequestStarted(`User selected option ${optionId}: ${optionText}`)

    try {
      // 模拟网络延迟
      await this.delay()

      // 模拟错误
      if (this.shouldSimulateError()) {
        const error = `AI service temporarily unavailable (option: ${optionId})`
        gameEventHelpers.emitAIRequestFailed(error)
        return { success: false, error }
      }

      // 获取下一轮数据
      const nextRoundData = this.getNextRoundData()
      
      // 发射请求完成事件
      gameEventHelpers.emitAIRequestCompleted(nextRoundData)

      return {
        success: true,
        data: nextRoundData,
        delay: this.defaultDelay
      }
    } catch (error) {
      const errorMsg = `Mock API error: ${error}`
      gameEventHelpers.emitAIRequestFailed(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  // 模拟AI请求 - 处理用户文本输入
  async processUserInput(input: string): Promise<MockApiResponse> {
    if (!this.isEnabled) {
      return { success: false, error: 'Mock API is disabled' }
    }

    // 发射请求开始事件
    gameEventHelpers.emitAIRequestStarted(`User input: ${input}`)

    try {
      // 模拟网络延迟
      await this.delay()

      // 模拟错误
      if (this.shouldSimulateError()) {
        const error = `AI service error processing input: ${input.slice(0, 50)}...`
        gameEventHelpers.emitAIRequestFailed(error)
        return { success: false, error }
      }

      // 生成响应数据
      const responseData = this.generateResponseFromInput(input)
      
      // 发射请求完成事件
      gameEventHelpers.emitAIRequestCompleted(responseData)

      return {
        success: true,
        data: responseData,
        delay: this.defaultDelay
      }
    } catch (error) {
      const errorMsg = `Mock API error: ${error}`
      gameEventHelpers.emitAIRequestFailed(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  // 获取下一轮预设数据
  private getNextRoundData(): MockAIResponse {
    // 使用预设的Mock数据循环
    if (this.currentRoundIndex >= mockRounds.length) {
      this.currentRoundIndex = 0
    }
    
    const roundData = mockRounds[this.currentRoundIndex]
    this.currentRoundIndex++

    return {
      scene: roundData.scene,
      narration: roundData.narration,
      options: roundData.options,
      status: roundData.status,
      custom: this.normalizeCustomData(roundData.customData),
    }
  }

  // 根据用户输入生成响应
  private generateResponseFromInput(input: string): MockAIResponse {
    // 简单的关键词响应逻辑
    let scene = getRandomScene()
    let narration = getRandomNarration()
    
    // 根据输入内容调整响应
    if (input.includes('攻击') || input.includes('战斗')) {
      scene = "战斗的硝烟弥漫在空气中，你握紧手中的武器，准备迎接挑战。"
      narration = "经过激烈的战斗，你的战斗技巧得到了提升。"
    } else if (input.includes('探索') || input.includes('寻找')) {
      scene = "你踏上了探索的道路，周围的环境充满了未知和神秘。"
      narration = "在探索过程中，你发现了一些有趣的线索。"
    } else if (input.includes('休息') || input.includes('恢复')) {
      scene = "你找到了一个安全的地方休息，感受着周围宁静的氛围。"
      narration = "充分的休息让你恢复了精力和活力。"
    }

    return {
      scene,
      narration,
      options: getRandomOptions(),
      status: this.generateRandomStatusUpdate(),
      custom: this.generateRandomCustomData()
    }
  }

  // 生成随机状态更新
  private generateRandomStatusUpdate(): StatusItem[] {
    return [
      { name: "生命值", value: Math.floor(Math.random() * 100) + 1, max: 100, type: "progress" },
      { name: "魔力", value: Math.floor(Math.random() * 100) + 1, max: 100, type: "progress" },
      { name: "经验", value: Math.floor(Math.random() * 200), type: "number" },
      { name: "等级", value: Math.floor(Math.random() * 5) + 1, type: "number" },
    ]
  }

  // 生成随机自定义数据
  private generateRandomCustomData(): MockAICustomPayload {
    return {
      quests: [
        { name: "当前任务", status: "进行中", progress: Math.floor(Math.random() * 100) }
      ],
      relationships: [
        { name: "NPC", level: Math.floor(Math.random() * 5) + 1, maxLevel: 5 }
      ],
      inventory: [
        { name: "随机物品", count: Math.floor(Math.random() * 10) + 1, description: "系统生成的物品" }
      ]
    }
  }

  private normalizeCustomData(customData?: Record<string, unknown>): MockAICustomPayload | undefined {
    if (!customData) {
      return undefined
    }

    const { quests, relationships, inventory, cards, ...rest } = customData as MockAICustomPayload & Record<string, unknown>
    const normalized: MockAICustomPayload = {}

    if (Array.isArray(quests)) {
      normalized.quests = quests as Quest[]
    }

    if (Array.isArray(relationships)) {
      normalized.relationships = relationships as Relationship[]
    }

    if (Array.isArray(inventory)) {
      normalized.inventory = inventory as InventoryRecord[]
    }

    const baseCards = typeof cards === 'object' && cards !== null ? (cards as Record<string, unknown>) : undefined
    const additionalEntries = Object.keys(rest)

    if (additionalEntries.length > 0) {
      normalized.cards = {
        ...(baseCards ?? {}),
        ...rest
      }
    } else if (baseCards) {
      normalized.cards = baseCards
    }

    return normalized
  }

  // 手动触发数据更新（用于测试）
  async triggerRandomUpdate(): Promise<MockApiResponse> {
    const randomData = getRandomMockData()
    
    // 模拟延迟
    await this.delay(500)
    
    return {
      success: true,
      data: {
        scene: randomData.scene,
        narration: randomData.narration,
        options: randomData.options,
        status: randomData.status,
        custom: this.normalizeCustomData(randomData.customData),
      },
    }
  }

  // 重置回合计数器
  resetRoundCounter(): void {
    this.currentRoundIndex = 0
  }

  // 获取当前配置信息
  getConfig() {
    return {
      isEnabled: this.isEnabled,
      defaultDelay: this.defaultDelay,
      errorRate: this.errorRate,
      currentRoundIndex: this.currentRoundIndex
    }
  }
}

// 创建全局Mock API实例
export const mockApi = new MockApi()

// 游戏控制器类 - 连接Mock API和游戏状态
export class GameController {
  private gameStore = useGameStore

  // 处理选项点击
  async handleOptionClick(option: GameOption) {
    const store = this.gameStore.getState()
    
    // 设置加载状态
    store.setLoading(true)
    store.selectOption(option)
    
    // 发射事件
    gameEventHelpers.emitOptionSelected(option.id, option.text)
    
    try {
      // 调用Mock API
      const response = await mockApi.processUserOption(option.id, option.text)
      
      if (response.success && response.data) {
        // 更新游戏状态
        this.updateGameState(response.data)
        
        // 记录到历史
        const roundData: Omit<GameRound, 'roundNumber' | 'timestamp'> = {
          scene: response.data.scene,
          narration: response.data.narration,
          options: response.data.options,
          status: response.data.status,
          customData: response.data.custom
        }
        
        store.nextRound(roundData)
        
        // 发射事件
        gameEventHelpers.emitRoundCompleted(store.currentRound, response.data)
      } else {
        // 处理错误
        store.setError(response.error || 'Unknown error')
      }
    } catch (error) {
      store.setError(`Game controller error: ${error}`)
    } finally {
      store.setLoading(false)
    }
  }

  // 处理用户文本输入
  async handleUserInput(input: string) {
    const store = this.gameStore.getState()
    
    store.setLoading(true)
    store.submitUserInput(input)
    
    gameEventHelpers.emitUserInputSubmitted(input)
    
    try {
      const response = await mockApi.processUserInput(input)
      
      if (response.success && response.data) {
        this.updateGameState(response.data)
        
        const roundData: Omit<GameRound, 'roundNumber' | 'timestamp'> = {
          scene: response.data.scene,
          narration: response.data.narration,
          options: response.data.options,
          status: response.data.status,
          customData: response.data.custom
        }
        
        store.nextRound(roundData)
        gameEventHelpers.emitRoundCompleted(store.currentRound, response.data)
      } else {
        store.setError(response.error || 'Unknown error')
      }
    } catch (error) {
      store.setError(`Game controller error: ${error}`)
    } finally {
      store.setLoading(false)
    }
  }

  // 更新游戏状态
  private updateGameState(data: MockAIResponse) {
    const store = this.gameStore.getState()
    
    // 更新基础游戏数据
    store.setScene(data.scene)
    store.setNarration(data.narration)
    store.setOptions(data.options)
    store.setStatusItems(data.status)
    
    // 更新扩展数据
    if (data.custom) {
      if (data.custom.quests) store.setQuests(data.custom.quests)
      if (data.custom.relationships) store.setRelationships(data.custom.relationships)
      if (data.custom.inventory) store.setInventory(data.custom.inventory)
      if (data.custom.cards) store.setCustomCards(data.custom.cards)
    }
    
    // 发射状态更新事件
    gameEventBus.emit('status-updated', { statusItems: data.status })
    if (data.custom?.quests) gameEventBus.emit('quests-updated', { quests: data.custom.quests })
    if (data.custom?.relationships) gameEventBus.emit('relationships-updated', { relationships: data.custom.relationships })
    if (data.custom?.inventory) gameEventBus.emit('inventory-updated', { inventory: data.custom.inventory })
  }

  // 手动触发随机更新（用于测试）
  async triggerRandomUpdate() {
    const store = this.gameStore.getState()
    store.setLoading(true)
    
    try {
      const response = await mockApi.triggerRandomUpdate()
      if (response.success && response.data) {
        this.updateGameState(response.data)
      }
    } catch (error) {
      store.setError(`Random update error: ${error}`)
    } finally {
      store.setLoading(false)
    }
  }
}

// 创建全局游戏控制器实例
export const gameController = new GameController()

// 便捷的Hook函数
export const useMockApi = () => {
  return {
    mockApi,
    gameController,
    processOption: gameController.handleOptionClick.bind(gameController),
    processInput: gameController.handleUserInput.bind(gameController),
    triggerUpdate: gameController.triggerRandomUpdate.bind(gameController),
  }
}

// 导出默认实例
export default mockApi






