import type { GameOption } from "@/stores/gameStore"

interface ActionAreaProps {
  options?: GameOption[]
  onOptionClick: (option: GameOption) => void
  loading?: boolean
}

const DEFAULT_OPTIONS: GameOption[] = [
  { id: "A", text: "继续" },
  { id: "B", text: "等待" },
  { id: "C", text: "返回" },
]

const ACTION_IDS: Array<GameOption["id"]> = ["A", "B", "C"]

const cloneOption = (option: GameOption): GameOption => ({
  ...option,
  disabled: option.disabled ?? false,
})

const normalizeOptions = (rawOptions?: GameOption[]): GameOption[] => {
  if (!rawOptions || rawOptions.length === 0) {
    return DEFAULT_OPTIONS.map(cloneOption)
  }

  return ACTION_IDS.map((id) => {
    const existing = rawOptions.find((item) => item.id === id)
    if (existing) {
      return cloneOption({ ...existing, id })
    }

    const fallback = DEFAULT_OPTIONS.find((item) => item.id === id)!
    return cloneOption(fallback)
  })
}

export function ActionArea({ options, onOptionClick, loading = false }: ActionAreaProps) {
  const finalOptions = normalizeOptions(options)

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 text-foreground">行动选择</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full p-3 bg-muted rounded-md">
              <div className="h-4 bg-muted-foreground/20 animate-pulse rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const isFallback = !options || options.length === 0

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
        <span className="w-2 h-2 bg-primary rounded-full" />
        行动选择
      </h3>
      <div className="space-y-3">
        {finalOptions.map((option) => {
          const isDisabled = option.disabled === true
          return (
            <button
              key={option.id}
              onClick={() => onOptionClick(option)}
              disabled={isDisabled}
              className={`
                w-full text-left p-4 rounded-md transition-all duration-200 font-medium
                ${!isDisabled
                  ? "bg-muted hover:bg-muted/80 text-foreground hover:shadow-md active:scale-95 lg:active:scale-100"
                  : "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60"
                }
              `}
            >
              <span className="inline-flex items-center gap-3">
                <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {option.id}
                </span>
                <span>{option.text}</span>
              </span>
            </button>
          )
        })}
      </div>
      {isFallback && (
        <div className="mt-3 text-xs text-muted-foreground text-center">
          <span className="italic">AI解析失败，使用默认选项</span>
        </div>
      )}
    </div>
  )
}
