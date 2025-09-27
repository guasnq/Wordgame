import React, { useState } from "react"
import { useGameStore, gameSelectors } from "@/stores/gameStore"
import { useMockApi } from "@/utils/mockApi"
import { gameEventBus } from "@/utils/eventBus"

export function StateDebugger() {
  const [isOpen, setIsOpen] = useState(false)
  const [eventLog, setEventLog] = useState<string[]>([])
  
  // 使用游戏状态选择器
  const gameContent = gameSelectors.useGameContent()
  const statusItems = gameSelectors.useStatusItems()
  const isLoading = gameSelectors.useIsLoading()
  const error = gameSelectors.useError()
  const currentRound = gameSelectors.useCurrentRound()
  const quests = gameSelectors.useQuests()
  const relationships = gameSelectors.useRelationships()
  const inventory = gameSelectors.useInventory()
  
  // 获取完整的store状态
  const fullState = useGameStore()
  
  // Mock API控制器
  const { triggerUpdate } = useMockApi()
  
  // 监听所有事件并记录到日志
  React.useEffect(() => {
    const events = [
      'option-selected',
      'user-input-submitted', 
      'ai-request-started',
      'ai-request-completed',
      'ai-request-failed',
      'error-occurred',
      'status-updated',
      'quests-updated',
      'relationships-updated',
      'inventory-updated'
    ] as const
    
    const unsubscribes = events.map(event => 
      gameEventBus.on(event, (data) => {
        const timestamp = new Date().toLocaleTimeString()
        const logEntry = `[${timestamp}] ${event}: ${JSON.stringify(data)}`
        setEventLog(prev => [...prev.slice(-9), logEntry]) // 保持最新10条记录
      })
    )
    
    return () => {
      unsubscribes.forEach(unsub => unsub())
    }
  }, [])
  
  const handleTriggerUpdate = async () => {
    try {
      await triggerUpdate()
    } catch (error) {
      console.error('触发更新失败:', error)
    }
  }
  
  const handleResetGame = () => {
    fullState.resetGame()
  }
  
  const handleClearEventLog = () => {
    setEventLog([])
  }
  
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm shadow-lg hover:bg-purple-700"
        >
          🐛 调试工具
        </button>
      </div>
    )
  }
  
  return (
    <div className="fixed bottom-4 left-4 w-96 max-h-96 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-purple-600 text-white px-4 py-2 flex justify-between items-center">
        <h3 className="font-semibold">游戏状态调试器</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-80 text-sm">
        {/* 基础状态信息 */}
        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">基础状态</h4>
          <div className="space-y-1 text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <div>当前回合: {currentRound}</div>
            <div>加载状态: {isLoading ? '是' : '否'}</div>
            <div>错误: {error || '无'}</div>
            <div>场景长度: {gameContent.scene.length} 字符</div>
            <div>选项数量: {gameContent.options.length}</div>
            <div>状态项数量: {statusItems.length}</div>
          </div>
        </div>
        
        {/* 扩展数据 */}
        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">扩展数据</h4>
          <div className="space-y-1 text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded">
            <div>任务数量: {quests.length}</div>
            <div>关系数量: {relationships.length}</div>
            <div>物品数量: {inventory.length}</div>
          </div>
        </div>
        
        {/* 控制按钮 */}
        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">操作控制</h4>
          <div className="space-y-2">
            <button
              onClick={handleTriggerUpdate}
              disabled={isLoading}
              className="w-full bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? '更新中...' : '触发随机更新'}
            </button>
            <button
              onClick={handleResetGame}
              className="w-full bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
            >
              重置游戏
            </button>
            <button
              onClick={handleClearEventLog}
              className="w-full bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600"
            >
              清空事件日志
            </button>
          </div>
        </div>
        
        {/* 事件日志 */}
        <div>
          <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">事件日志</h4>
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded max-h-32 overflow-y-auto">
            {eventLog.length === 0 ? (
              <div className="text-xs text-gray-500">暂无事件记录</div>
            ) : (
              eventLog.map((log, index) => (
                <div key={index} className="text-xs text-gray-600 dark:text-gray-300 mb-1 font-mono">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 仅在开发环境显示
export function DevStateDebugger() {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return <StateDebugger />
}