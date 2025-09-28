/**
 * 模块容器实现
 * 提供模块间依赖注入和生命周期管理
 */

import type { 
  ModuleContainer, 
  ModuleInterface, 
  ModuleLifecycleEvents 
} from '../../../types/interfaces'
import { globalEventBus } from './EventBusManager'

/**
 * 模块注册信息
 */
interface ModuleRegistration {
  module: any
  isInitialized: boolean
  registeredAt: number
  initializedAt?: number
  dependencies?: string[]
}

/**
 * 模块容器实现类
 * 
 * 功能特性：
 * - 模块注册和解析
 * - 依赖关系管理
 * - 生命周期事件发布
 * - 循环依赖检测
 * - 模块初始化顺序控制
 */
export class ModuleContainerImpl implements ModuleContainer {
  private modules = new Map<string, ModuleRegistration>()
  private initializationOrder: string[] = []

  /**
   * 注册模块
   * @param name 模块名称
   * @param module 模块实例
   */
  register<T>(name: string, module: T): void {
    // 检查模块是否已注册
    if (this.modules.has(name)) {
      throw new Error(`Module '${name}' is already registered`)
    }

    // 验证模块接口（如果是标准模块）
    const dependencies = this.extractDependencies(module)

    // 注册模块
    const registration: ModuleRegistration = {
      module,
      isInitialized: false,
      registeredAt: Date.now(),
      dependencies
    }

    this.modules.set(name, registration)

    // 发布模块注册事件
    globalEventBus.emit<ModuleLifecycleEvents['module:registered']>('module:registered', {
      name,
      module
    })

    // 如果是标准模块接口，检查依赖关系并初始化
    if (this.isStandardModule(module)) {
      this.scheduleInitialization(name)
    }
  }

  /**
   * 解析模块
   * @param name 模块名称
   * @returns 模块实例
   */
  resolve<T>(name: string): T {
    const registration = this.modules.get(name)
    if (!registration) {
      throw new Error(`Module "${name}" is not registered`)
    }

    return registration.module as T
  }

  /**
   * 检查模块是否存在
   * @param name 模块名称
   * @returns 是否存在
   */
  has(name: string): boolean {
    return this.modules.has(name)
  }

  /**
   * 注销模块
   * @param name 模块名称
   * @returns 是否成功注销
   */
  unregister(name: string): boolean {
    const registration = this.modules.get(name)
    if (!registration) {
      return false
    }

    // 如果是标准模块，调用destroy方法
    if (this.isStandardModule(registration.module)) {
      try {
        registration.module.destroy()
      } catch (error) {
        console.error(`Error destroying module "${name}":`, error)
        globalEventBus.emit<ModuleLifecycleEvents['module:error']>('module:error', {
          name,
          error: error as Error
        })
      }
    }

    // 从初始化顺序中移除
    const index = this.initializationOrder.indexOf(name)
    if (index !== -1) {
      this.initializationOrder.splice(index, 1)
    }

    // 删除注册信息
    this.modules.delete(name)

    // 发布模块销毁事件
    globalEventBus.emit<ModuleLifecycleEvents['module:destroyed']>('module:destroyed', {
      name,
      module: registration.module
    })

    return true
  }

  /**
   * 列出所有已注册的模块
   * @returns 模块名称列表
   */
  list(): string[] {
    return Array.from(this.modules.keys())
  }

  /**
   * 获取模块信息
   * @param name 模块名称
   * @returns 模块信息
   */
  getModuleInfo(name: string): ModuleRegistration | undefined {
    return this.modules.get(name)
  }

  /**
   * 获取初始化顺序
   * @returns 模块初始化顺序
   */
  getInitializationOrder(): string[] {
    return [...this.initializationOrder]
  }

  /**
   * 手动初始化模块
   * @param name 模块名称
   */
  async initializeModule(name: string): Promise<void> {
    const registration = this.modules.get(name)
    if (!registration) {
      throw new Error(`Module "${name}" is not registered`)
    }

    if (registration.isInitialized) {
      return // 已经初始化
    }

    // 检查依赖关系
    if (registration.dependencies) {
      await this.ensureDependencies(registration.dependencies)
    }

    try {
      // 如果是标准模块，调用初始化方法
      if (this.isStandardModule(registration.module)) {
        await registration.module.initialize()
      }

      // 更新状态
      registration.isInitialized = true
      registration.initializedAt = Date.now()

      // 添加到初始化顺序
      if (!this.initializationOrder.includes(name)) {
        this.initializationOrder.push(name)
      }

      // 发布初始化事件
      globalEventBus.emit<ModuleLifecycleEvents['module:initialized']>('module:initialized', {
        name,
        module: registration.module
      })

    } catch (error) {
      console.error(`Error initializing module "${name}":`, error)
      globalEventBus.emit<ModuleLifecycleEvents['module:error']>('module:error', {
        name,
        error: error as Error
      })
      throw error
    }
  }

  /**
   * 销毁所有模块
   */
  async destroyAll(): Promise<void> {
    // 按初始化顺序的逆序销毁模块
    const destroyOrder = [...this.initializationOrder].reverse()
    
    for (const name of destroyOrder) {
      try {
        await this.destroyModule(name)
      } catch (error) {
        console.error(`Error destroying module "${name}":`, error)
      }
    }

    // 清理所有注册信息
    this.modules.clear()
    this.initializationOrder = []
  }

  /**
   * 销毁单个模块
   * @private
   */
  private async destroyModule(name: string): Promise<void> {
    const registration = this.modules.get(name)
    if (!registration) {
      return
    }

    if (this.isStandardModule(registration.module)) {
      await registration.module.destroy()
    }

    registration.isInitialized = false
  }

  /**
   * 检查是否为标准模块接口
   * @private
   */
  private isStandardModule(module: any): module is ModuleInterface {
    return (
      module &&
      typeof module.name === 'string' &&
      typeof module.version === 'string' &&
      Array.isArray(module.dependencies) &&
      typeof module.initialize === 'function' &&
      typeof module.destroy === 'function' &&
      typeof module.getAPI === 'function'
    )
  }

  /**
   * 提取模块依赖关系
   * @private
   */
  private extractDependencies(module: any): string[] | undefined {
    if (this.isStandardModule(module)) {
      return module.dependencies
    }
    return undefined
  }

  /**
   * 安排模块初始化
   * @private
   */
  private scheduleInitialization(name: string): void {
    // 在下一个事件循环中初始化，确保所有依赖模块都已注册
    setTimeout(async () => {
      try {
        await this.initializeModule(name)
      } catch (error) {
        console.error(`Failed to initialize module "${name}":`, error)
      }
    }, 0)
  }

  /**
   * 确保依赖模块已初始化
   * @private
   */
  private async ensureDependencies(dependencies: string[]): Promise<void> {
    for (const dep of dependencies) {
      if (!this.has(dep)) {
        throw new Error(`Dependency "${dep}" is not registered`)
      }

      const depRegistration = this.modules.get(dep)!
      if (!depRegistration.isInitialized) {
        await this.initializeModule(dep)
      }
    }
  }

  /**
   * 检测循环依赖
   * @private
   */
  private detectCircularDependencies(): void {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const visit = (name: string): boolean => {
      if (recursionStack.has(name)) {
        return true // 找到循环依赖
      }

      if (visited.has(name)) {
        return false
      }

      visited.add(name)
      recursionStack.add(name)

      const registration = this.modules.get(name)
      if (registration?.dependencies) {
        for (const dep of registration.dependencies) {
          if (visit(dep)) {
            return true
          }
        }
      }

      recursionStack.delete(name)
      return false
    }

    for (const name of this.modules.keys()) {
      if (visit(name)) {
        throw new Error(`Circular dependency detected involving module "${name}"`)
      }
    }
  }
}

/**
 * 全局模块容器实例
 */
export const globalModuleContainer = new ModuleContainerImpl()