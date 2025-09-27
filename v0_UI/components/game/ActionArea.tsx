"use client"

interface ActionOption {
  id: string
  text: string
}

interface ActionAreaProps {
  options: ActionOption[]
  onOptionClick: (option: ActionOption) => void
}

export function ActionArea({ options, onOptionClick }: ActionAreaProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 text-foreground">行动选择</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onOptionClick(option)}
            className="w-full text-left p-3 bg-muted hover:bg-muted/80 rounded-md transition-colors duration-200 text-foreground active:scale-95 lg:active:scale-100"
          >
            <span className="font-medium text-primary">{option.id}:</span> {option.text}
          </button>
        ))}
      </div>
    </div>
  )
}
