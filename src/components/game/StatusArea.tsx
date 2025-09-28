import { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import type { StatusItem } from "@/types/game"

interface StatusAreaProps {
  items: StatusItem[]
  loading?: boolean
  defaultCollapsed?: boolean
}

export function StatusArea({ items, loading = false, defaultCollapsed = true }: StatusAreaProps) {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed)
  
  // 获取关键状态用于收起时显示
  const getKeyStats = (items: StatusItem[]): StatusItem[] => {
    // 优先显示生命值、魔力值、经验值等关键属性
    const keyNames = ['生命值', '血量', '健康', 'HP', 'Health', '魔力', '法力', 'MP', 'Mana', '经验', 'EXP', 'Experience']
    const keyStats = items.filter(item => 
      keyNames.some(name => 
        item.name.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(item.name.toLowerCase())
      )
    )
    
    // 如果没有找到关键属性，返回前3个
    if (keyStats.length === 0) {
      return items.slice(0, 3)
    }
    
    return keyStats.slice(0, 3)
  }

  const keyStats = getKeyStats(items)
  const displayItems = isExpanded ? items : keyStats

  const renderStatusItem = (item: StatusItem, index: number, isCompact = false) => (
    <div key={index} className={`space-y-1 ${isCompact ? 'space-y-0.5' : ''}`}>
      <div className="flex justify-between items-center">
        <span className={`font-medium text-foreground ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {item.name}:
        </span>
        {item.type === "progress" && item.max && (
          <span className={`text-muted-foreground ${isCompact ? 'text-xs' : 'text-xs'}`}>
            {item.value}/{item.max}
          </span>
        )}
        {item.type === "number" && (
          <span className={`text-foreground ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {item.value}
          </span>
        )}
        {item.type === "text" && (
          <span className={`text-foreground ${isCompact ? 'text-xs' : 'text-sm'} truncate max-w-20`}>
            {item.value}
          </span>
        )}
      </div>
      {item.type === "progress" && item.max && (
        <div className={`w-full bg-muted rounded-full ${isCompact ? 'h-1.5' : 'h-2'}`}>
          <div
            className={`bg-primary rounded-full transition-all duration-300 ${isCompact ? 'h-1.5' : 'h-2'}`}
            style={{ width: `${Math.min(100, Math.max(0, (Number(item.value) / item.max) * 100))}%` }}
          />
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">角色状态</h3>
          <div className="w-4 h-4 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <div className="h-3 bg-muted animate-pulse rounded w-16"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-8"></div>
              </div>
              <div className="h-2 bg-muted animate-pulse rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4 text-left hover:bg-muted/20 rounded p-1 -m-1 transition-colors"
      >
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full"></span>
          角色状态
        </h3>
        <div className="flex items-center gap-1">
          {!isExpanded && items.length > keyStats.length && (
            <span className="text-xs text-muted-foreground">
              +{items.length - keyStats.length}
            </span>
          )}
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      
      <div className={`space-y-3 ${!isExpanded ? 'space-y-2' : ''}`}>
        {displayItems.length === 0 ? (
          <p className="text-muted-foreground italic text-sm">
            暂无状态数据
          </p>
        ) : (
          displayItems.map((item, index) => 
            renderStatusItem(item, index, !isExpanded)
          )
        )}
      </div>
      
      {!isExpanded && items.length > keyStats.length && (
        <div className="mt-3 text-center">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            查看全部状态 ({items.length}项)
          </button>
        </div>
      )}
    </div>
  )
}
