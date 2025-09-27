

interface MobileExtensionMenuProps {
  onExtensionClick: (type: string) => void
  onSystemClick?: (type: string) => void
}

export function MobileExtensionMenu({ onExtensionClick, onSystemClick }: MobileExtensionMenuProps) {
  const gameExtensions = [
    {
      id: "inventory",
      name: "背包",
      description: "查看携带的物品",
      icon: "🎒",
      category: "game",
    },
    {
      id: "quests",
      name: "任务",
      description: "查看当前任务",
      icon: "📋",
      category: "game",
    },
    {
      id: "relationships",
      name: "人际关系",
      description: "查看NPC关系",
      icon: "👥",
      category: "game",
    },
  ]

  const systemExtensions = [
    {
      id: "settings",
      name: "设置",
      description: "游戏设置和选项",
      icon: "⚙️",
      category: "system",
    },
    {
      id: "worldview",
      name: "世界观",
      description: "查看世界背景信息",
      icon: "🌍",
      category: "system",
    },
    {
      id: "presets",
      name: "预设",
      description: "角色预设管理",
      icon: "👤",
      category: "system",
    },
    {
      id: "saves",
      name: "存档",
      description: "存档管理和载入",
      icon: "💾",
      category: "system",
    },
  ]

  const handleSystemClick = (extensionId: string) => {
    if (onSystemClick) {
      onSystemClick(extensionId)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3 px-1">游戏功能</h4>
        <div className="space-y-2">
          {gameExtensions.map((extension) => (
            <button
              key={extension.id}
              onClick={() => onExtensionClick(extension.id)}
              className="w-full p-3 bg-card border border-border rounded-lg text-left hover:bg-muted/50 transition-colors duration-200 active:scale-95"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{extension.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{extension.name}</div>
                  <div className="text-sm text-muted-foreground">{extension.description}</div>
                </div>
                <div className="text-muted-foreground">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3 px-1">系统功能</h4>
        <div className="space-y-2">
          {systemExtensions.map((extension) => (
            <button
              key={extension.id}
              onClick={() => handleSystemClick(extension.id)}
              className="w-full p-3 bg-card border border-border rounded-lg text-left hover:bg-muted/50 transition-colors duration-200 active:scale-95"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{extension.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{extension.name}</div>
                  <div className="text-sm text-muted-foreground">{extension.description}</div>
                </div>
                <div className="text-muted-foreground">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
