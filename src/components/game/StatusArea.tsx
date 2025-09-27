import type { StatusItem } from "@/types/game"

interface StatusAreaProps {
  items: StatusItem[]
}

export function StatusArea({ items }: StatusAreaProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 text-foreground">角色状态</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">{item.name}:</span>
              {item.type === "progress" && item.max && (
                <span className="text-xs text-muted-foreground">
                  {item.value}/{item.max}
                </span>
              )}
              {item.type === "number" && <span className="text-sm text-foreground">{item.value}</span>}
              {item.type === "text" && <span className="text-sm text-foreground">{item.value}</span>}
            </div>
            {item.type === "progress" && item.max && (
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(Number(item.value) / item.max) * 100}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
