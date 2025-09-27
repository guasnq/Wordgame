"use client"

interface PresetCardProps {
  className?: string
}

export function PresetCard({ className = "" }: PresetCardProps) {
  const presets = [
    {
      id: "warrior",
      name: "勇敢战士",
      description: "擅长近战和防御的角色",
      stats: { hp: 100, mp: 30, str: 15, def: 12, agi: 8 },
      active: true,
    },
    {
      id: "mage",
      name: "智慧法师",
      description: "精通魔法和元素操控",
      stats: { hp: 60, mp: 80, str: 6, def: 8, agi: 10 },
      active: false,
    },
    {
      id: "rogue",
      name: "敏捷盗贼",
      description: "速度快，擅长潜行和暗杀",
      stats: { hp: 75, mp: 40, str: 10, def: 8, agi: 16 },
      active: false,
    },
    {
      id: "custom",
      name: "自定义角色",
      description: "根据个人喜好定制的角色",
      stats: { hp: 80, mp: 50, str: 12, def: 10, agi: 12 },
      active: false,
    },
  ]

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-foreground">角色预设</h3>

      <div className="space-y-3">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              preset.active ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-foreground">{preset.name}</h4>
              {preset.active && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">当前</span>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-3">{preset.description}</p>

            <div className="grid grid-cols-5 gap-2 text-xs">
              <div className="text-center">
                <div className="text-muted-foreground">HP</div>
                <div className="font-medium text-foreground">{preset.stats.hp}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">MP</div>
                <div className="font-medium text-foreground">{preset.stats.mp}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">力量</div>
                <div className="font-medium text-foreground">{preset.stats.str}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">防御</div>
                <div className="font-medium text-foreground">{preset.stats.def}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">敏捷</div>
                <div className="font-medium text-foreground">{preset.stats.agi}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          创建新预设
        </button>
      </div>
    </div>
  )
}
