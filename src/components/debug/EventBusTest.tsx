/**
 * 事件总线测试组件
 * 用于验证事件总线功能是否正常工作
 */

import React, { useState, useEffect } from 'react'
import { EventBusManager } from '../../modules/core/eventBus'
import { GameEvent } from '../../types/enums'

interface TestMessage {
  id: string
  message: string
  timestamp: number
  type: 'sent' | 'received'
}

export const EventBusTest: React.FC = () => {
  const [messages, setMessages] = useState<TestMessage[]>([])
  const [stats, setStats] = useState<any>(null)
  const [testInput, setTestInput] = useState('')
  const [eventBus] = useState(() => EventBusManager.getInstance().getEventBus())

  useEffect(() => {
    // 订阅测试事件
    const unsubscribe1 = eventBus.on('test:message', (data: any) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        message: `收到测试消息: ${data.message || JSON.stringify(data)}`,
        timestamp: Date.now(),
        type: 'received'
      }])
    })

    // 订阅游戏事件
    const unsubscribe2 = eventBus.on(GameEvent.STATE_CHANGED, (data: any) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        message: `游戏状态变化: ${JSON.stringify(data)}`,
        timestamp: Date.now(),
        type: 'received'
      }])
    })

    // 订阅错误事件
    const unsubscribe3 = eventBus.on(GameEvent.ERROR_OCCURRED, (data: any) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        message: `错误事件: ${data.error || JSON.stringify(data)}`,
        timestamp: Date.now(),
        type: 'received'
      }])
    })

    // 定期更新统计信息
    const statsInterval = setInterval(() => {
      const eventBusStats = eventBus.getStats()
      setStats(eventBusStats)
    }, 1000)

    return () => {
      unsubscribe1()
      unsubscribe2()
      unsubscribe3()
      clearInterval(statsInterval)
    }
  }, [eventBus])

  const sendTestMessage = () => {
    if (!testInput.trim()) return

    const message = {
      id: Date.now().toString(),
      message: testInput,
      timestamp: Date.now(),
      type: 'sent' as const
    }

    setMessages(prev => [...prev, message])
    
    // 发送事件
    eventBus.emit('test:message', { message: testInput })
    
    setTestInput('')
  }

  const sendGameEvent = () => {
    const testData = {
      event: 'test_event',
      data: { value: Math.random() },
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      message: `发送游戏事件: ${JSON.stringify(testData)}`,
      timestamp: Date.now(),
      type: 'sent'
    }])

    eventBus.emit(GameEvent.STATE_CHANGED, testData)
  }

  const sendErrorEvent = () => {
    const errorData = {
      error: 'Test error message',
      context: { test: true }
    }

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      message: `发送错误事件: ${JSON.stringify(errorData)}`,
      timestamp: Date.now(),
      type: 'sent'
    }])

    eventBus.emit(GameEvent.ERROR_OCCURRED, errorData)
  }

  const clearMessages = () => {
    setMessages([])
  }

  const testOnceEvent = () => {
    const unsubscribe = eventBus.once('test:once', (data: any) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        message: `一次性事件收到: ${JSON.stringify(data)}`,
        timestamp: Date.now(),
        type: 'received'
      }])
    })

    // 立即发送事件测试
    setTimeout(() => {
      eventBus.emit('test:once', { message: 'Once event test' })
    }, 100)

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      message: '发送一次性事件测试',
      timestamp: Date.now(),
      type: 'sent'
    }])
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">事件总线测试工具</h1>
          <p className="text-muted-foreground">测试和验证事件总线系统的功能</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 控制面板 */}
          <div className="space-y-4">
            <div className="bg-card p-4 rounded-lg border border-border">
              <h2 className="text-xl font-semibold mb-3">控制面板</h2>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
                    placeholder="输入测试消息..."
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-background"
                  />
                  <button
                    onClick={sendTestMessage}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    发送
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={sendGameEvent}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    游戏事件
                  </button>
                  <button
                    onClick={sendErrorEvent}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    错误事件
                  </button>
                  <button
                    onClick={testOnceEvent}
                    className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    一次性事件
                  </button>
                  <button
                    onClick={clearMessages}
                    className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    清空消息
                  </button>
                </div>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="bg-card p-4 rounded-lg border border-border">
              <h2 className="text-xl font-semibold mb-3">事件总线统计</h2>
              {stats ? (
                <div className="space-y-2 text-sm">
                  <div>总事件数: <span className="font-mono">{stats.totalEvents}</span></div>
                  <div>订阅者数量: <span className="font-mono">{stats.subscriberCount}</span></div>
                  <div>平均处理时间: <span className="font-mono">
                    {stats.averageProcessingTime || 0}ms
                  </span></div>
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-2">事件类型统计:</div>
                    <div className="space-y-1 text-xs">
                      {stats.eventsByType && Object.entries(stats.eventsByType).map(([event, count]) => (
                        <div key={event} className="flex justify-between">
                          <span className="truncate">{event}:</span>
                          <span className="font-mono">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">加载统计信息...</div>
              )}
            </div>
          </div>

          {/* 消息日志 */}
          <div className="bg-card p-4 rounded-lg border border-border">
            <h2 className="text-xl font-semibold mb-3">事件日志</h2>
            <div className="h-96 overflow-y-auto space-y-2">
              {messages.length === 0 ? (
                <div className="text-muted-foreground text-center py-8">
                  暂无消息
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-md text-sm ${
                      msg.type === 'sent'
                        ? 'bg-blue-100 text-blue-800 ml-4'
                        : 'bg-green-100 text-green-800 mr-4'
                    }`}
                  >
                    <div className="font-medium">{msg.message}</div>
                    <div className="text-xs opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 调试信息 */}
        <div className="mt-6 bg-card p-4 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-3">调试信息</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <div>事件总线实例: {eventBus ? '✅ 已创建' : '❌ 未创建'}</div>
            <div>当前活跃订阅数: {stats?.subscriberCount || 0}</div>
            <div>开发调试模式: {process.env.NODE_ENV === 'development' ? '✅ 启用' : '❌ 禁用'}</div>
            <div>全局调试接口: {typeof (window as any).__eventBusDebug !== 'undefined' ? '✅ 可用' : '❌ 不可用'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}