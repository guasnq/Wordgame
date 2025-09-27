import type { GameOption, GameRound } from '@/stores/gameStore'
import type { StatusItem, Quest, Relationship } from '@/types/game'

// Mock 场景数据
export const mockScenes = [
  "你站在一座古老的森林入口，高大的橡树遮天蔽日，远处传来神秘的鸟鸣声。一条石板路蜿蜒向前，消失在浓密的树林中。",
  "村庄的广场上人声鼎沸，商贩们正在叫卖各种商品。你注意到一位神秘的黑袍法师站在角落，似乎在观察着什么。",
  "你来到了一座废弃的城堡前，城墙上爬满了藤蔓，大门半掩着。从门缝中透出微弱的蓝光，似乎有什么东西在里面。",
  "夜幕降临，你在山洞中生起了篝火。洞外传来狼嚎声，你需要决定如何度过这个危险的夜晚。",
  "你发现了一个古老的图书馆，书架上摆满了厚重的魔法书籍。一本发光的书本悬浮在空中，似乎在等待有人开启。"
]

// Mock 旁白数据
export const mockNarrations = [
  "微风轻抚过你的脸颊，带来了远方的花香。你感觉到自己的实力在这次冒险中有所提升。",
  "村民们看向你的眼神充满了敬意，你在这里的声望正在稳步提升。",
  "一种古老的魔法力量在你体内觉醒，你感觉到自己与这个世界的联系更加紧密了。",
  "经过激烈的战斗，你的战斗技巧得到了显著提升，同时也获得了一些珍贵的物品。",
  "神秘的知识填满了你的大脑，你对这个世界的理解更加深刻了。"
]

// Mock 选项数据组
export const mockOptionSets: Array<GameOption[]> = [
  [
    { id: 'A', text: '勇敢地走进森林深处' },
    { id: 'B', text: '在入口处仔细观察环境' },
    { id: 'C', text: '寻找其他路径绕过森林' }
  ],
  [
    { id: 'A', text: '上前与黑袍法师交谈' },
    { id: 'B', text: '在广场上购买一些物品' },
    { id: 'C', text: '悄悄跟踪黑袍法师' }
  ],
  [
    { id: 'A', text: '推开城堡大门走进去' },
    { id: 'B', text: '绕着城堡寻找其他入口' },
    { id: 'C', text: '在远处观察城堡的情况' }
  ],
  [
    { id: 'A', text: '准备武器守夜' },
    { id: 'B', text: '用魔法设置防护结界' },
    { id: 'C', text: '尝试与狼群沟通' }
  ],
  [
    { id: 'A', text: '直接打开发光的书本' },
    { id: 'B', text: '先研究其他书籍' },
    { id: 'C', text: '小心地检查书本的魔法陷阱' }
  ]
]

// Mock 状态项数据变化
export const mockStatusUpdates: Array<StatusItem[]> = [
  [
    { name: "生命值", value: 95, max: 100, type: "progress" },
    { name: "魔力", value: 60, max: 100, type: "progress" },
    { name: "经验", value: 25, type: "number" },
    { name: "等级", value: 1, type: "number" },
  ],
  [
    { name: "生命值", value: 100, max: 100, type: "progress" },
    { name: "魔力", value: 45, max: 100, type: "progress" },
    { name: "经验", value: 50, type: "number" },
    { name: "等级", value: 1, type: "number" },
  ],
  [
    { name: "生命值", value: 85, max: 100, type: "progress" },
    { name: "魔力", value: 80, max: 100, type: "progress" },
    { name: "经验", value: 100, type: "number" },
    { name: "等级", value: 2, type: "number" },
  ],
  [
    { name: "生命值", value: 90, max: 100, type: "progress" },
    { name: "魔力", value: 30, max: 100, type: "progress" },
    { name: "经验", value: 125, type: "number" },
    { name: "等级", value: 2, type: "number" },
  ],
  [
    { name: "生命值", value: 100, max: 100, type: "progress" },
    { name: "魔力", value: 85, max: 120, type: "progress" },
    { name: "经验", value: 180, type: "number" },
    { name: "等级", value: 3, type: "number" },
  ]
]

// Mock 任务更新
export const mockQuestUpdates: Array<Quest[]> = [
  [
    { name: "森林探索", status: "进行中", progress: 30 },
    { name: "寻找神秘法师", status: "未开始", progress: 0 },
  ],
  [
    { name: "森林探索", status: "已完成", progress: 100 },
    { name: "寻找神秘法师", status: "进行中", progress: 50 },
    { name: "古堡之谜", status: "未开始", progress: 0 },
  ],
  [
    { name: "寻找神秘法师", status: "已完成", progress: 100 },
    { name: "古堡之谜", status: "进行中", progress: 40 },
    { name: "魔法图书馆", status: "未开始", progress: 0 },
  ],
  [
    { name: "古堡之谜", status: "已完成", progress: 100 },
    { name: "魔法图书馆", status: "进行中", progress: 60 },
    { name: "远古秘密", status: "未开始", progress: 0 },
  ],
  [
    { name: "魔法图书馆", status: "已完成", progress: 100 },
    { name: "远古秘密", status: "进行中", progress: 20 },
    { name: "终极挑战", status: "未开始", progress: 0 },
  ]
]

// Mock 关系更新
export const mockRelationshipUpdates: Array<Relationship[]> = [
  [
    { name: "森林精灵", level: 2, maxLevel: 5 },
    { name: "神秘向导", level: 3, maxLevel: 5 },
  ],
  [
    { name: "森林精灵", level: 3, maxLevel: 5 },
    { name: "神秘向导", level: 4, maxLevel: 5 },
    { name: "村庄长老", level: 1, maxLevel: 5 },
  ],
  [
    { name: "森林精灵", level: 4, maxLevel: 5 },
    { name: "神秘向导", level: 5, maxLevel: 5 },
    { name: "村庄长老", level: 2, maxLevel: 5 },
    { name: "古堡守护者", level: 1, maxLevel: 5 },
  ],
  [
    { name: "神秘向导", level: 5, maxLevel: 5 },
    { name: "村庄长老", level: 3, maxLevel: 5 },
    { name: "古堡守护者", level: 2, maxLevel: 5 },
    { name: "智慧法师", level: 1, maxLevel: 5 },
  ],
  [
    { name: "村庄长老", level: 4, maxLevel: 5 },
    { name: "古堡守护者", level: 3, maxLevel: 5 },
    { name: "智慧法师", level: 3, maxLevel: 5 },
    { name: "龙族使者", level: 1, maxLevel: 5 },
  ]
]

// Mock 背包物品更新
export const mockInventoryUpdates = [
  [
    { name: "森林草药", count: 3, description: "恢复少量生命值" },
    { name: "新手剑", count: 1, description: "基础武器" },
    { name: "生命药水", count: 2, description: "恢复50生命值" },
  ],
  [
    { name: "森林草药", count: 5, description: "恢复少量生命值" },
    { name: "精钢剑", count: 1, description: "锋利的武器" },
    { name: "生命药水", count: 4, description: "恢复50生命值" },
    { name: "魔力药水", count: 2, description: "恢复30魔力值" },
  ],
  [
    { name: "森林草药", count: 7, description: "恢复少量生命值" },
    { name: "魔法剑", count: 1, description: "附魔武器" },
    { name: "高级生命药水", count: 3, description: "恢复80生命值" },
    { name: "魔力药水", count: 5, description: "恢复30魔力值" },
    { name: "古老符文", count: 1, description: "蕴含神秘力量" },
  ],
  [
    { name: "森林草药", count: 10, description: "恢复少量生命值" },
    { name: "传说之剑", count: 1, description: "传说级武器" },
    { name: "高级生命药水", count: 5, description: "恢复80生命值" },
    { name: "高级魔力药水", count: 3, description: "恢复60魔力值" },
    { name: "古老符文", count: 3, description: "蕴含神秘力量" },
    { name: "时空水晶", count: 1, description: "极其珍贵的材料" },
  ],
  [
    { name: "森林草药", count: 15, description: "恢复少量生命值" },
    { name: "神话武器", count: 1, description: "神话级武器" },
    { name: "完美生命药水", count: 3, description: "完全恢复生命值" },
    { name: "完美魔力药水", count: 3, description: "完全恢复魔力值" },
    { name: "远古符文", count: 5, description: "远古力量的结晶" },
    { name: "时空水晶", count: 3, description: "极其珍贵的材料" },
    { name: "龙鳞护甲", count: 1, description: "传说中的防具" },
  ]
]

// Mock 完整回合数据
export const mockRounds: Array<Omit<GameRound, 'roundNumber' | 'timestamp'>> = [
  {
    scene: mockScenes[0],
    narration: mockNarrations[0],
    options: mockOptionSets[0],
    status: mockStatusUpdates[0],
    customData: {
      quests: mockQuestUpdates[0],
      relationships: mockRelationshipUpdates[0],
      inventory: mockInventoryUpdates[0],
    }
  },
  {
    scene: mockScenes[1],
    narration: mockNarrations[1],
    options: mockOptionSets[1],
    status: mockStatusUpdates[1],
    customData: {
      quests: mockQuestUpdates[1],
      relationships: mockRelationshipUpdates[1],
      inventory: mockInventoryUpdates[1],
    }
  },
  {
    scene: mockScenes[2],
    narration: mockNarrations[2],
    options: mockOptionSets[2],
    status: mockStatusUpdates[2],
    customData: {
      quests: mockQuestUpdates[2],
      relationships: mockRelationshipUpdates[2],
      inventory: mockInventoryUpdates[2],
    }
  },
  {
    scene: mockScenes[3],
    narration: mockNarrations[3],
    options: mockOptionSets[3],
    status: mockStatusUpdates[3],
    customData: {
      quests: mockQuestUpdates[3],
      relationships: mockRelationshipUpdates[3],
      inventory: mockInventoryUpdates[3],
    }
  },
  {
    scene: mockScenes[4],
    narration: mockNarrations[4],
    options: mockOptionSets[4],
    status: mockStatusUpdates[4],
    customData: {
      quests: mockQuestUpdates[4],
      relationships: mockRelationshipUpdates[4],
      inventory: mockInventoryUpdates[4],
    }
  }
]

// 随机选择工具函数
export const getRandomMockData = () => {
  const randomIndex = Math.floor(Math.random() * mockRounds.length)
  return mockRounds[randomIndex]
}

export const getRandomScene = () => {
  return mockScenes[Math.floor(Math.random() * mockScenes.length)]
}

export const getRandomNarration = () => {
  return mockNarrations[Math.floor(Math.random() * mockNarrations.length)]
}

export const getRandomOptions = () => {
  return mockOptionSets[Math.floor(Math.random() * mockOptionSets.length)]
}