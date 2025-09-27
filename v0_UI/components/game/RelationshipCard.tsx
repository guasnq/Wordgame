import { ExtensionCard } from "./ExtensionCard"

interface Relationship {
  name: string
  level: number
  maxLevel: number
}

interface RelationshipCardProps {
  relationships: Relationship[]
}

export function RelationshipCard({ relationships }: RelationshipCardProps) {
  const renderHearts = (level: number, maxLevel: number) => {
    return Array.from({ length: maxLevel }, (_, index) => (
      <span key={index} className={`text-lg ${index < level ? "text-red-500" : "text-muted-foreground/30"}`}>
        ♥
      </span>
    ))
  }

  return (
    <ExtensionCard title="人际关系">
      {relationships.length > 0 ? (
        <div className="space-y-3">
          {relationships.map((relationship, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-muted/50 rounded-md hover:bg-muted/70 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">{relationship.name}</span>
              <div className="flex items-center gap-1">{renderHearts(relationship.level, relationship.maxLevel)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground text-sm">暂无关系记录</div>
      )}
    </ExtensionCard>
  )
}
