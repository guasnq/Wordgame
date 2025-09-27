

import { ThemeToggle } from "./ThemeToggle"
import { SystemDropdown } from "./SystemDropdown"
import { useMobile } from "@/hooks/use-mobile"

interface GameHeaderProps {
  connectionStatus: "connected" | "connecting" | "disconnected"
  onSystemClick?: (type: string) => void
}

export function GameHeader({ connectionStatus, onSystemClick }: GameHeaderProps) {
  const isMobile = useMobile()

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-500"
      case "connecting":
        return "text-yellow-500"
      case "disconnected":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "已连接"
      case "connecting":
        return "连接中..."
      case "disconnected":
        return "已断开"
      default:
        return "未知"
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-foreground">aichat.games</h1>
        {isMobile && (
          <div className="flex gap-2">
            <SystemDropdown onSystemClick={onSystemClick || (() => {})} />
            <ThemeToggle />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {!isMobile && (
          <div className="flex gap-2">
            <button
              onClick={() => onSystemClick?.("settings")}
              className="text-sm px-3 py-1 bg-muted rounded hover:bg-muted/80 transition-colors"
            >
              设置
            </button>
            <button
              onClick={() => onSystemClick?.("worldview")}
              className="text-sm px-3 py-1 bg-muted rounded hover:bg-muted/80 transition-colors"
            >
              世界观
            </button>
            <button
              onClick={() => onSystemClick?.("presets")}
              className="text-sm px-3 py-1 bg-muted rounded hover:bg-muted/80 transition-colors"
            >
              预设
            </button>
            <button
              onClick={() => onSystemClick?.("saves")}
              className="text-sm px-3 py-1 bg-muted rounded hover:bg-muted/80 transition-colors"
            >
              存档
            </button>
            <ThemeToggle />
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          连接状态: <span className={getStatusColor()}>{getStatusText()}</span>
        </div>
      </div>
    </div>
  )
}
