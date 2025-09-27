interface SceneAreaProps {
  scene: string
}

export function SceneArea({ scene }: SceneAreaProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4 text-foreground">场景描述</h2>
      <div className="text-foreground leading-relaxed text-pretty">{scene}</div>
    </div>
  )
}
