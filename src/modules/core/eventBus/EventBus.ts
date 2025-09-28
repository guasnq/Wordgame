/**
 * 事件总线核心实现
 * 基于API接口文档3.5节事件总线接口的完整实现
 */

import type { 
  EventBusAPI, 
  EventHandler, 
  EmitOptions, 
  SubscribeOptions, 
  EventStats,
  UnsubscribeFunction 
} from '../../../types/interfaces'

/**
 * 内部订阅者信息结构
 */
interface Subscriber<T = any> {
  handler: EventHandler<T>
  options: SubscribeOptions
  id: string
  createdAt: number
}

/**
 * 事件处理结果
 */
interface EventProcessingResult {
  success: boolean
  duration: number
  error?: Error
}

/**
 * 事件总线核心类
 * 
 * 功能特性：
 * - 类型安全的事件发布订阅
 * - 支持异步事件处理
 * - 订阅优先级控制
 * - 事件过滤机制
 * - 性能监控和统计
 * - 内存泄漏防护
 */
export class EventBus implements EventBusAPI {
  private subscribers = new Map<string, Set<Subscriber>>()
  private stats = {
    totalEvents: 0,
    eventsByType: new Map<string, number>(),
    subscriberCount: 0,
    processingTimes: [] as number[]
  }
  private subscriberIdCounter = 0

  /**
   * 发布事件
   * @param event 事件名称
   * @param data 事件数据
   * @param options 发布选项
   */
  emit<T>(event: string, data: T, options: EmitOptions = {}): void {
    const startTime = performance.now()
    
    try {
      // 更新统计信息
      this.stats.totalEvents++
      this.stats.eventsByType.set(event, (this.stats.eventsByType.get(event) || 0) + 1)

      // 获取订阅者列表
      const eventSubscribers = this.subscribers.get(event)
      if (!eventSubscribers || eventSubscribers.size === 0) {
        return
      }

      // 将订阅者转换为数组并按优先级排序
      const sortedSubscribers = Array.from(eventSubscribers).sort((a, b) => {
        const priorityA = a.options.priority || 0
        const priorityB = b.options.priority || 0
        return priorityB - priorityA // 高优先级在前
      })

      // 处理事件
      if (options.async) {
        // 异步处理
        this.processEventAsync(event, data, sortedSubscribers, options)
      } else {
        // 同步处理
        this.processEventSync(event, data, sortedSubscribers, options)
      }

    } catch (error) {
      console.error(`[EventBus] Error emitting event "${event}":`, error)
    } finally {
      // 记录处理时间
      const duration = performance.now() - startTime
      this.stats.processingTimes.push(duration)
      
      // 保持处理时间数组大小在合理范围内
      if (this.stats.processingTimes.length > 1000) {
        this.stats.processingTimes = this.stats.processingTimes.slice(-500)
      }
    }
  }

  /**
   * 订阅事件
   * @param event 事件名称
   * @param handler 事件处理器
   * @param options 订阅选项
   * @returns 取消订阅函数
   */
  on<T>(event: string, handler: EventHandler<T>, options: SubscribeOptions = {}): UnsubscribeFunction {
    const subscriberId = this.generateSubscriberId()
    
    const subscriber: Subscriber<T> = {
      handler,
      options,
      id: subscriberId,
      createdAt: Date.now()
    }

    // 确保事件订阅者集合存在
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set())
    }

    // 添加订阅者
    this.subscribers.get(event)!.add(subscriber)
    this.stats.subscriberCount++

    // 返回取消订阅函数
    return () => {
      this.removeSubscriber(event, subscriber)
    }
  }

  /**
   * 一次性订阅事件
   * @param event 事件名称
   * @param handler 事件处理器
   * @returns 取消订阅函数
   */
  once<T>(event: string, handler: EventHandler<T>): UnsubscribeFunction {
    return this.on(event, handler, { once: true })
  }

  /**
   * 取消事件订阅
   * @param event 事件名称
   * @param handler 事件处理器（可选，如果不提供则移除所有订阅者）
   */
  off<T>(event: string, handler?: EventHandler<T>): void {
    const eventSubscribers = this.subscribers.get(event)
    if (!eventSubscribers) {
      return
    }

    if (handler) {
      // 移除特定处理器
      for (const subscriber of eventSubscribers) {
        if (subscriber.handler === handler) {
          this.removeSubscriber(event, subscriber)
          break
        }
      }
    } else {
      // 移除所有订阅者
      this.stats.subscriberCount -= eventSubscribers.size
      eventSubscribers.clear()
    }
  }

  /**
   * 清除所有事件订阅
   */
  clear(): void {
    this.subscribers.clear()
    this.stats.subscriberCount = 0
  }

  /**
   * 获取事件统计信息
   * @returns 事件统计数据
   */
  getStats(): EventStats {
    const avgProcessingTime = this.stats.processingTimes.length > 0
      ? this.stats.processingTimes.reduce((sum, time) => sum + time, 0) / this.stats.processingTimes.length
      : 0

    return {
      totalEvents: this.stats.totalEvents,
      eventsByType: Object.fromEntries(this.stats.eventsByType),
      subscriberCount: this.stats.subscriberCount,
      averageProcessingTime: Math.round(avgProcessingTime * 100) / 100 // 保留2位小数
    }
  }

  /**
   * 同步处理事件
   * @private
   */
  private processEventSync<T>(
    event: string, 
    data: T, 
    subscribers: Subscriber<T>[], 
    options: EmitOptions
  ): void {
    for (const subscriber of subscribers) {
      try {
        // 应用过滤器
        if (subscriber.options.filter && !subscriber.options.filter(data)) {
          continue
        }

        // 调用处理器
        subscriber.handler(data)

        // 处理一次性订阅
        if (subscriber.options.once) {
          this.removeSubscriber(event, subscriber)
        }

        // 如果不是广播模式，处理一个就停止
        if (!options.broadcast) {
          break
        }
      } catch (error) {
        console.error(`[EventBus] Error in event handler for "${event}":`, error)
        // 继续处理其他订阅者，不因一个处理器错误而中断
      }
    }
  }

  /**
   * 异步处理事件
   * @private
   */
  private async processEventAsync<T>(
    event: string, 
    data: T, 
    subscribers: Subscriber<T>[], 
    options: EmitOptions
  ): Promise<void> {
    const timeout = options.timeout || 5000 // 默认5秒超时

    for (const subscriber of subscribers) {
      try {
        // 应用过滤器
        if (subscriber.options.filter && !subscriber.options.filter(data)) {
          continue
        }

        try {
          // 创建超时 Promise
          const timeoutPromise = new Promise<void>((_, reject) => {
            setTimeout(() => reject(new Error('Event handler timeout')), timeout)
          })

          // 调用处理器（包装成 Promise）
          const handlerPromise = Promise.resolve(subscriber.handler(data))

          // 等待处理器执行或超时
          await Promise.race([handlerPromise, timeoutPromise])
        } catch (error) {
          console.error(`Event handler failed for ${event}:`, error)
          // 不抛出错误，继续处理其他订阅者
        }

        // 处理一次性订阅
        if (subscriber.options.once) {
          this.removeSubscriber(event, subscriber)
        }

        // 如果不是广播模式，处理一个就停止
        if (!options.broadcast) {
          break
        }
      } catch (error) {
        console.error(`[EventBus] Error in async event handler for "${event}":`, error)
        // 继续处理其他订阅者
      }
    }
  }

  /**
   * 移除订阅者
   * @private
   */
  private removeSubscriber(event: string, subscriber: Subscriber): void {
    const eventSubscribers = this.subscribers.get(event)
    if (eventSubscribers && eventSubscribers.has(subscriber)) {
      eventSubscribers.delete(subscriber)
      this.stats.subscriberCount--

      // 如果该事件没有订阅者了，移除事件键
      if (eventSubscribers.size === 0) {
        this.subscribers.delete(event)
      }
    }
  }

  /**
   * 生成订阅者ID
   * @private
   */
  private generateSubscriberId(): string {
    return `subscriber_${++this.subscriberIdCounter}_${Date.now()}`
  }

  /**
   * 获取调试信息
   * @returns 调试信息对象
   */
  getDebugInfo(): Record<string, any> {
    return {
      activeEvents: Array.from(this.subscribers.keys()),
      subscribersPerEvent: Object.fromEntries(
        Array.from(this.subscribers.entries()).map(([event, subs]) => [event, subs.size])
      ),
      stats: this.getStats(),
      memoryUsage: {
        subscriberMapSize: this.subscribers.size,
        totalSubscribers: this.stats.subscriberCount
      }
    }
  }

  /**
   * 销毁事件总线，清理所有资源
   */
  destroy(): void {
    this.clear()
    this.stats = {
      totalEvents: 0,
      eventsByType: new Map(),
      subscriberCount: 0,
      processingTimes: []
    }
    this.subscriberIdCounter = 0
  }
}