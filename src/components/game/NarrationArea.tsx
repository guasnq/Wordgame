interface NarrationAreaProps {
  narration: string
  loading?: boolean
}

export function NarrationArea({ narration, loading = false }: NarrationAreaProps) {
  // 确保旁白简洁性 - 限制在1-3句话范围内
  const formatNarration = (text: string) => {
    // 按句号、感叹号、问号分割句子
    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim())
    
    // 如果超过3句，只显示前3句
    const limitedSentences = sentences.slice(0, 3)
    
    return limitedSentences.map((sentence, index) => {
      const trimmed = sentence.trim()
      if (!trimmed) return null
      
      // 为每句添加适当的标点
      const punctuation = text.match(/[。！？.!?]/g)?.[index] || '。'
      
      return (
        <span key={index} className="block mb-1 last:mb-0">
          {trimmed}{punctuation}
        </span>
      )
    }).filter(Boolean)
  }

  if (loading) {
    return (
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">旁白</h3>
        <div className="space-y-2">
          <div className="h-3 bg-muted animate-pulse rounded w-full"></div>
          <div className="h-3 bg-muted animate-pulse rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
        旁白
      </h3>
      <div className="text-foreground text-sm leading-relaxed">
        {narration ? (
          <div className="italic font-medium space-y-1">
            {formatNarration(narration)}
          </div>
        ) : (
          <p className="text-muted-foreground/70 italic">等待旁白叙述...</p>
        )}
      </div>
    </div>
  )
}
