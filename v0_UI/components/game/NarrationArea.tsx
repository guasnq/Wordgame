interface NarrationAreaProps {
  narration: string
}

export function NarrationArea({ narration }: NarrationAreaProps) {
  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-2 text-muted-foreground">旁白</h3>
      <div className="text-foreground text-sm leading-relaxed text-pretty">{narration}</div>
    </div>
  )
}
