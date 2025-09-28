
interface ActionOption {
  id: 'A' | 'B' | 'C'  // 严格限制为A、B、C三个选项
  text: string
  enabled?: boolean
}

interface ActionAreaProps {
  options?: ActionOption[]  // 可选，失败时使用默认选项
  onOptionClick: (option: ActionOption) => void
  loading?: boolean
}

// 默认选项，当AI解析失败时使用
const DEFAULT_OPTIONS: ActionOption[] = [
  { id: 'A', text: '继续', enabled: true },
  { id: 'B', text: '等待', enabled: true },
  { id: 'C', text: '返回', enabled: true },
]

export function ActionArea({ options, onOptionClick, loading = false }: ActionAreaProps) {
  // 确保始终有且仅有3个选项
  const normalizeOptions = (rawOptions?: ActionOption[]): ActionOption[] => {
    if (!rawOptions || rawOptions.length === 0) {
      return DEFAULT_OPTIONS
    }

    // 确保有A、B、C三个选项
    const normalizedOptions: ActionOption[] = []
    const optionIds: ('A' | 'B' | 'C')[] = ['A', 'B', 'C']
    
    optionIds.forEach(id => {
      const existingOption = rawOptions.find(opt => opt.id === id)
      if (existingOption) {
        normalizedOptions.push({
          id,
          text: existingOption.text,
          enabled: existingOption.enabled !== false
        })
      } else {
        // 使用默认选项填补缺失
        const defaultOption = DEFAULT_OPTIONS.find(opt => opt.id === id)!
        normalizedOptions.push(defaultOption)
      }
    })

    return normalizedOptions
  }

  const finalOptions = normalizeOptions(options)

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 text-foreground">行动选择</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full p-3 bg-muted rounded-md">
              <div className="h-4 bg-muted-foreground/20 animate-pulse rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
        <span className="w-2 h-2 bg-primary rounded-full"></span>
        行动选择
      </h3>
      <div className="space-y-3">
        {finalOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onOptionClick(option)}
            disabled={option.enabled === false}
            className={`
              w-full text-left p-4 rounded-md transition-all duration-200 font-medium
              ${option.enabled !== false
                ? 'bg-muted hover:bg-muted/80 text-foreground hover:shadow-md active:scale-95 lg:active:scale-100'
                : 'bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60'
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
        ))}
      </div>
      
      {/* 显示是否使用了默认选项的提示 */}
      {(!options || options.length === 0) && (
        <div className="mt-3 text-xs text-muted-foreground text-center">
          <span className="italic">AI解析失败，使用默认选项</span>
        </div>
      )}
    </div>
  )
}
