/**
 * 事件总线管理器 - 单例模式
 * 确保整个应用只有一个全局事件总线实例
 */

import { EventBus } from './EventBus'
import type { EventBusAPI, EventStats } from '../../../types/interfaces'

// 扩展window对象类型
declare global {
  interface Window {
    __eventBusDebug?: {
      getEventBus: () => EventBusAPI
      getDebugInfo: () => Record<string, unknown>
      getStats: () => EventStats
      clearAllSubscribers: () => void
    }
  }
}

/**
 * 事件总线管理器
 * 
 * 功能特性：
 * - 单例模式，确保全局唯一实例
 * - 提供全局访问点
 * - 支持热重载时的实例重用
 * - 生命周期管理
 */
export class EventBusManager {
  private static instance: EventBusManager | null = null
  private eventBus: EventBus
  private isInitialized = false

  /**
   * 私有构造函数，防止外部直接实例化
   */
  private constructor() {
    this.eventBus = new EventBus()
    this.initialize()
  }

  /**
   * 获取单例实例
   * @returns EventBusManager实例
   */
  public static getInstance(): EventBusManager {
    if (!EventBusManager.instance) {
      EventBusManager.instance = new EventBusManager()
    }
    return EventBusManager.instance
  }

  /**
   * 获取事件总线实例
   * @returns 事件总线API接口
   */
  public getEventBus(): EventBusAPI {
    return this.eventBus
  }

  /**
   * 初始化事件总线
   * @private
   */
  private initialize(): void {
    if (this.isInitialized) {
      return
    }

    // 注册全局错误处理
    this.setupGlobalErrorHandling()
    
    // 注册开发环境调试功能
    this.setupDevTools()

    this.isInitialized = true
  }

  /**
   * 设置全局错误处理
   * @private
   */
  private setupGlobalErrorHandling(): void {
    // 监听未捕获的Promise rejection
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        console.error('[EventBus] Unhandled promise rejection in event handler:', event.reason)
        // 发布全局错误事件
        this.eventBus.emit('*', {
          event: 'system:error',
          type: 'unhandled_rejection',
          error: event.reason,
          timestamp: Date.now()
        })
      })
    }
  }

  /**
   * 设置开发工具
   * @private
   */
  private setupDevTools(): void {
    // 仅在开发环境下启用
    if (process.env.NODE_ENV === 'development') {
      // 在全局对象上暴露调试接口
      if (typeof window !== 'undefined') {
        window.__eventBusDebug = {
          getEventBus: () => this.eventBus,
          getDebugInfo: () => this.eventBus.getDebugInfo(),
          getStats: () => this.eventBus.getStats(),
          clearAllSubscribers: () => this.eventBus.clear()
        }
      }

      // 添加性能监控
      this.eventBus.on('*', () => {
        // 通配符监听器用于性能监控
      })
    }
  }

  /**
   * 重置事件总线实例
   * 主要用于测试环境或热重载场景
   */
  public reset(): void {
    this.eventBus.destroy()
    this.eventBus = new EventBus()
    this.isInitialized = false
    this.initialize()
  }

  /**
   * 销毁事件总线管理器
   * 清理所有资源
   */
  public destroy(): void {
    this.eventBus.destroy()
    EventBusManager.instance = null
    this.isInitialized = false

    // 清理全局调试对象
    if (typeof window !== 'undefined') {
      delete window.__eventBusDebug
    }
  }

  /**
   * 获取事件总线统计信息
   * @returns 统计信息
   */
  public getStats() {
    return this.eventBus.getStats()
  }

  /**
   * 检查是否已初始化
   * @returns 是否已初始化
   */
  public isReady(): boolean {
    return this.isInitialized
  }
}

/**
 * 全局事件总线实例
 * 提供便捷的访问方式
 */
export const globalEventBus = EventBusManager.getInstance().getEventBus()

/**
 * 导出事件总线管理器实例
 */
export const eventBusManager = EventBusManager.getInstance()





