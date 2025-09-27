interface GameStatusBarProps {
  status: string
  isLoading?: boolean
}

export function GameStatusBar({ status, isLoading = false }: GameStatusBarProps) {
  return (
    <div className="p-2 border-t border-border bg-muted text-center text-sm text-muted-foreground">
      <div className="flex items-center justify-center gap-2">
        {isLoading && (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
        状态: {status}
      </div>
    </div>
  )
}
