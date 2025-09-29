import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { StatusItem, Quest, Relationship } from '@/types/game'

// 游戏选项类型
export interface GameOption {
  id: 'A' | 'B' | 'C'
  text: string
  disabled?: boolean
}

// 游戏回合数据
export interface GameRound {
  roundNumber: number
  scene: string
  narration: string
  options: GameOption[]
  status: StatusItem[]
  customData?: Record<string, unknown>
  timestamp: number
}

// 游戏状态接口
export interface GameState {
  // 当前游戏状态
  currentRound: number
  isLoading: boolean
  scene: string
  narration: string
  options: GameOption[]
  statusItems: StatusItem[]
  
  // 扩展卡片数据
  quests: Quest[]
  relationships: Relationship[]
  inventory: Array<{ name: string; count: number; description?: string }>
  customCards: Record<string, unknown>
  
  // 游戏历史
  gameHistory: GameRound[]
  
  // 用户输入
  lastUserInput: string
  selectedOption: GameOption | null
  
  // 错误状态
  error: string | null
  
  // Actions
  setScene: (scene: string) => void
  setNarration: (narration: string) => void
  setOptions: (options: GameOption[]) => void
  setStatusItems: (items: StatusItem[]) => void
  setQuests: (quests: Quest[]) => void
  setRelationships: (relationships: Relationship[]) => void
  setInventory: (inventory: Array<{ name: string; count: number; description?: string }>) => void
  setCustomCards: (cards: Record<string, unknown>) => void
  
  // 游戏流程控制
  selectOption: (option: GameOption) => void
  submitUserInput: (input: string) => void
  nextRound: (roundData: Omit<GameRound, 'roundNumber' | 'timestamp'>) => void
  
  // 状态管理
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // 历史管理
  addToHistory: (round: GameRound) => void
  clearHistory: () => void
  getHistoryByRound: (roundNumber: number) => GameRound | undefined
  
  // 重置游戏
  resetGame: () => void
}

// 初始状态
const initialState = {
  currentRound: 0,
  isLoading: false,
  scene: "欢迎来到AI文字游戏世界！请配置您的世界观设定和角色状态后开始游戏。",
  narration: "系统正在等待您的配置...",
  options: [
    { id: 'A' as const, text: '配置世界观设定' },
    { id: 'B' as const, text: '配置角色状态' },
    { id: 'C' as const, text: '开始游戏' },
  ],
  statusItems: [
    { name: "生命值", value: 100, max: 100, type: "progress" as const },
    { name: "魔力", value: 50, max: 100, type: "progress" as const },
    { name: "经验", value: 0, type: "number" as const },
    { name: "等级", value: 1, type: "number" as const },
  ],
  quests: [
    { name: "新手指引", status: "进行中" as const, progress: 50 },
    { name: "世界探索", status: "未开始" as const, progress: 0 },
  ],
  relationships: [
    { name: "神秘向导", level: 3, maxLevel: 5 },
  ],
  inventory: [
    { name: "新手剑", count: 1, description: "基础武器" },
    { name: "生命药水", count: 3, description: "恢复50生命值" },
  ],
  customCards: {},
  gameHistory: [],
  lastUserInput: "",
  selectedOption: null,
  error: null,
}

// 创建游戏状态Store
export const useGameStore = create<GameState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setScene: (scene) => set({ scene }),
      setNarration: (narration) => set({ narration }),
      setOptions: (options) => set({ options }),
      setStatusItems: (statusItems) => set({ statusItems }),
      setQuests: (quests) => set({ quests }),
      setRelationships: (relationships) => set({ relationships }),
      setInventory: (inventory) => set({ inventory }),
      setCustomCards: (customCards) => set({ customCards }),
      
      selectOption: (option) => {
        set({ selectedOption: option, lastUserInput: option.text })
      },
      
      submitUserInput: (input) => {
        set({ lastUserInput: input, selectedOption: null })
      },
      
      nextRound: (roundData) => {
        const currentRound = get().currentRound + 1
        const newRound: GameRound = {
          ...roundData,
          roundNumber: currentRound,
          timestamp: Date.now(),
        }
        
        set((state: GameState) => ({
          currentRound,
          scene: roundData.scene,
          narration: roundData.narration,
          options: roundData.options,
          statusItems: roundData.status,
          gameHistory: [...state.gameHistory, newRound],
          selectedOption: null,
          error: null,
        }))
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      addToHistory: (round) => {
        set((state: GameState) => ({
          gameHistory: [...state.gameHistory, round]
        }))
      },
      
      clearHistory: () => set({ gameHistory: [] }),
      
      getHistoryByRound: (roundNumber) => {
        return get().gameHistory.find(round => round.roundNumber === roundNumber)
      },
      
      resetGame: () => {
        set({
          ...initialState,
          gameHistory: [], // 保留历史记录可选
        })
      },
    }),
    {
      name: 'game-store',
      partialize: (state: GameState) => ({
        // 只持久化必要的数据，排除临时状态
        currentRound: state.currentRound,
        scene: state.scene,
        narration: state.narration,
        options: state.options,
        statusItems: state.statusItems,
        quests: state.quests,
        relationships: state.relationships,
        inventory: state.inventory,
        customCards: state.customCards,
        gameHistory: state.gameHistory,
      }),
    }
  )
)

// 选择器 - 用于优化性能的状态选择器
export const gameSelectors = {
  // 基础状态选择器
  useCurrentRound: () => useGameStore((state) => state.currentRound),
  useIsLoading: () => useGameStore((state) => state.isLoading),
  useError: () => useGameStore((state) => state.error),
  
  // 游戏内容选择器
  useGameContent: () => useGameStore((state) => ({
    scene: state.scene,
    narration: state.narration,
    options: state.options,
  })),
  
  useStatusItems: () => useGameStore((state) => state.statusItems),
  
  // 扩展卡片选择器
  useQuests: () => useGameStore((state) => state.quests),
  useRelationships: () => useGameStore((state) => state.relationships),
  useInventory: () => useGameStore((state) => state.inventory),
  useCustomCards: () => useGameStore((state) => state.customCards),
  
  // 历史记录选择器
  useGameHistory: () => useGameStore((state) => state.gameHistory),
  useLastRounds: (count: number) => useGameStore((state) => 
    state.gameHistory.slice(-count)
  ),
  
  // 用户交互选择器
  useUserInput: () => useGameStore((state) => ({
    lastUserInput: state.lastUserInput,
    selectedOption: state.selectedOption,
  })),
}


