import { ExtensionCard } from "./ExtensionCard"

interface Quest {
  name: string
  status: "进行中" | "已完成" | "未开始"
  progress: number
}

interface QuestCardProps {
  quests: Quest[]
}

export function QuestCard({ quests }: QuestCardProps) {
  const getStatusColor = (status: Quest["status"]) => {
    switch (status) {
      case "已完成":
        return "text-green-500"
      case "进行中":
        return "text-blue-500"
      case "未开始":
        return "text-muted-foreground"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusBg = (status: Quest["status"]) => {
    switch (status) {
      case "已完成":
        return "bg-green-500/10"
      case "进行中":
        return "bg-blue-500/10"
      case "未开始":
        return "bg-muted/50"
      default:
        return "bg-muted/50"
    }
  }

  return (
    <ExtensionCard title="任务">
      {quests.length > 0 ? (
        <div className="space-y-3">
          {quests.map((quest, index) => (
            <div key={index} className={`p-3 rounded-md ${getStatusBg(quest.status)} border border-border/50`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{quest.name}</span>
                <span className={`text-xs font-medium ${getStatusColor(quest.status)}`}>{quest.status}</span>
              </div>
              {quest.status === "进行中" && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">进度</span>
                    <span className="text-xs text-muted-foreground">{quest.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${quest.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground text-sm">暂无任务</div>
      )}
    </ExtensionCard>
  )
}
