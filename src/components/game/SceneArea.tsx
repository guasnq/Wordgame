interface SceneAreaProps {
  scene: string
  loading?: boolean
}

export function SceneArea({ scene, loading = false }: SceneAreaProps) {
  // 处理段落分隔 - 将双换行符转换为段落
  const formatSceneText = (text: string) => {
    return text
      .split('\n\n')
      .filter(paragraph => paragraph.trim())
      .map((paragraph, index) => (
        <p key={index} className="mb-4 last:mb-0">
          {paragraph.trim()}
        </p>
      ))
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">场景描述</h2>
        <div className="space-y-3">
          <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-4/5"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-6 text-foreground flex items-center gap-2">
        <span className="w-2 h-2 bg-primary rounded-full"></span>
        场景描述
      </h2>
      <div className="prose prose-sm max-w-none text-foreground">
        <div className="text-foreground leading-relaxed text-pretty space-y-4 font-medium">
          {scene ? formatSceneText(scene) : (
            <p className="text-muted-foreground italic">等待场景描述...</p>
          )}
        </div>
      </div>
    </div>
  )
}
