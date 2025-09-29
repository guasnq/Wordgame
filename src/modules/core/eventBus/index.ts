/**
 * 事件总线模块导出
 * 提供统一的事件总线访问接口
 */

import { EventBus } from "./EventBus"
import { EventBusManager, globalEventBus, eventBusManager } from "./EventBusManager"
import { ModuleContainerImpl, globalModuleContainer } from "./ModuleContainer"
import type {
  EventBusAPI,
  EventHandler,
  EmitOptions,
  SubscribeOptions,
  EventStats,
  UnsubscribeFunction,
} from "@/types/interfaces"
import { GameEvent } from "@/types/enums"

export { EventBus, EventBusManager, globalEventBus, eventBusManager, ModuleContainerImpl, globalModuleContainer }
export type { EventBusAPI, EventHandler, EmitOptions, SubscribeOptions, EventStats, UnsubscribeFunction }
export { GameEvent }

/**
 * 便捷函数：获取全局事件总线实例
 * @returns 全局事件总线实例
 */
export function getEventBus(): EventBusAPI {
  return globalEventBus
}

/**
 * 便捷函数：发布事件
 * @param event 事件名称
 * @param data 事件数据
 * @param options 发布选项
 */
export function emit<T>(event: string, data: T, options?: EmitOptions): void {
  globalEventBus.emit(event, data, options)
}

/**
 * 便捷函数：订阅事件
 * @param event 事件名称
 * @param handler 事件处理器
 * @param options 订阅选项
 * @returns 取消订阅函数
 */
export function on<T>(event: string, handler: EventHandler<T>, options?: SubscribeOptions): UnsubscribeFunction {
  return globalEventBus.on(event, handler, options)
}

/**
 * 便捷函数：一次性订阅事件
 * @param event 事件名称
 * @param handler 事件处理器
 * @returns 取消订阅函数
 */
export function once<T>(event: string, handler: EventHandler<T>): UnsubscribeFunction {
  return globalEventBus.once(event, handler)
}

/**
 * 便捷函数：取消事件订阅
 * @param event 事件名称
 * @param handler 事件处理器（可选）
 */
export function off<T>(event: string, handler?: EventHandler<T>): void {
  globalEventBus.off(event, handler)
}
