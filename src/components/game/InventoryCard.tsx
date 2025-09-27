import { ExtensionCard } from "./ExtensionCard"

interface InventoryCardProps {
  items: string[]
}

export function InventoryCard({ items }: InventoryCardProps) {
  return (
    <ExtensionCard title="背包">
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-muted/50 rounded-md hover:bg-muted/70 transition-colors"
            >
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
              <span className="text-sm text-foreground">{item}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground text-sm">暂无物品</div>
      )}
    </ExtensionCard>
  )
}
