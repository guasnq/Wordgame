

interface SettingsCardProps {
  className?: string
}

export function SettingsCard({ className = "" }: SettingsCardProps) {
  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-foreground">游戏设置</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">音效音量</label>
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="80"
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">背景音乐音量</label>
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="60"
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">自动保存</span>
          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors">
            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">快速文本</span>
          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors">
            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">文本显示速度</label>
          <select className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground">
            <option>慢速</option>
            <option>正常</option>
            <option>快速</option>
            <option>瞬间</option>
          </select>
        </div>

        <div className="pt-4 border-t border-border">
          <button className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors">
            重置所有设置
          </button>
        </div>
      </div>
    </div>
  )
}
