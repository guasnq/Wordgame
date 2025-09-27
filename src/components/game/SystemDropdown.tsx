

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface SystemDropdownProps {
  onSystemClick: (type: string) => void
}

export function SystemDropdown({ onSystemClick }: SystemDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const systemOptions = [
    { id: "settings", label: "设置", icon: "⚙️" },
    { id: "worldview", label: "世界观", icon: "🌍" },
    { id: "presets", label: "预设", icon: "📋" },
    { id: "saves", label: "存档", icon: "💾" },
  ]

  const handleOptionClick = (optionId: string) => {
    onSystemClick(optionId)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm px-3 py-1 bg-muted rounded hover:bg-muted/80 transition-colors"
      >
        <span>系统</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown Menu */}
          <div className="absolute top-full right-0 mt-1 w-32 bg-card border border-border rounded-md shadow-lg z-20">
            <div className="py-1">
              {systemOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                >
                  <span className="text-xs">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
