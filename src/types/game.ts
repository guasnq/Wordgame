export interface StatusItem {
  name: string
  value: number | string
  max?: number
  type: "progress" | "number" | "text"
}

export interface ActionOption {
  id: string
  text: string
}

export interface Quest {
  name: string
  status: "进行中" | "已完成" | "未开始"
  progress: number
}

export interface Relationship {
  name: string
  level: number
  maxLevel: number
}

export interface GameState {
  scene: string
  narration: string
  status: StatusItem[]
  actions: ActionOption[]
  inventory: string[]
  quests: Quest[]
  relationships: Relationship[]
}