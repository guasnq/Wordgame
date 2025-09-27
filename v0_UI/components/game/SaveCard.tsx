"use client"

interface SaveCardProps {
  className?: string
}

export function SaveCard({ className = "" }: SaveCardProps) {
  const saves = [
    {
      id: 1,
      name: "城堡探险 - 第一章",
      date: "2024-01-15 14:30",
      location: "古老城堡门前",
      level: 5,
      playtime: "2小时30分钟",
      screenshot: "/castle-gate.jpg",
    },
    {
      id: 2,
      name: "森林冒险",
      date: "2024-01-14 20:15",
      location: "翡翠森林深处",
      level: 3,
      playtime: "1小时45分钟",
      screenshot: "/forest-adventure.jpg",
    },
    {
      id: 3,
      name: "新手村任务",
      date: "2024-01-13 16:45",
      location: "和谐村庄",
      level: 1,
      playtime: "45分钟",
      screenshot: "/peaceful-village.jpg",
    },
  ]

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-foreground">存档管理</h3>

      <div className="space-y-3">
        {saves.map((save) => (
          <div
            key={save.id}
            className="flex gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <img
              src={save.screenshot || "/placeholder.svg"}
              alt={save.name}
              className="w-20 h-15 object-cover rounded border"
            />

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate">{save.name}</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>位置: {save.location}</div>
                <div>
                  等级: {save.level} | 游戏时间: {save.playtime}
                </div>
                <div>保存时间: {save.date}</div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                载入
              </button>
              <button className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors">
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border space-y-2">
        <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          快速保存
        </button>
        <button className="w-full px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors">
          新建存档
        </button>
      </div>
    </div>
  )
}
