// 接口定义
// 基于API接口文档的各个模块API接口定义

import { 
  ConfigType, 
  ErrorCategory, 
  RecoveryStrategy
} from './enums'
import { 
  UserInput, 
  GameState, 
  ProcessResult, 
  StateUpdate, 
  GameStateSnapshot, 
  StatePatch, 
  StateChangeCallback, 
  UnsubscribeFunction, 
  SaveResult, 
  LoadResult 
} from './game'
import { 
  AIRequest, 
  AIResponse, 
  AIConfig, 
  ConnectionTestResult, 
  ConnectionStatus, 
  UsageStats 
} from './ai'
import { 
  GameConfiguration, 
  ConfigListItem, 
  ConfigExport, 
  ConfigImport, 
  ImportResult, 
  ValidationResult, 
  StorageOptions, 
  StorageStats 
} from './config'
import { 
  BaseError, 
  ProcessedError, 
  RetryConfig, 
  ErrorHandleResult, 
  RecoveryResult, 
  RecoveryRecord, 
  ErrorMetrics 
} from './error'


export type {
  GameState,
  GameRound,
  GameStateSnapshot,
  StateUpdate,
  StatePatch,
  StateChangeCallback,
  UnsubscribeFunction,
  SaveResult,
  LoadResult
} from './game'

export type { ValidationResult } from './config'

// ============== 游戏状态校验结果 ==============
export interface GameStateValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// ============== 游戏引擎核心接口 ==============
export interface GameEngineAPI {
  
  /**
   * 处理用户输入
   * @param input 用户输入数据
   * @returns 处理结果
   */
  processUserInput(input: UserInput): Promise<ProcessResult>
  
  /**
   * 更新游戏状态
   * @param updates 状态更新数据
   */
  updateGameState(updates: StateUpdate[]): void
  
  /**
   * 获取当前游戏状态
   * @returns 当前游戏状态
   */
  getCurrentState(): GameState
  
  /**
   * 开始新游戏
   * @param config 游戏配置
   */
  startNewGame(config: GameConfiguration): Promise<void>
  
  /**
   * 保存游戏进度
   * @returns 保存结果
   */
  saveGameProgress(): Promise<SaveResult>
  
  /**
   * 加载游戏进度
   * @param saveData 存档数据
   */
  loadGameProgress(saveData: unknown): Promise<LoadResult>
}

// ============== 状态管理接口 ==============
export interface StateManagerAPI {
  
  /**
   * 获取状态快照
   */
  getSnapshot(): GameStateSnapshot
  
  /**
   * 应用状态更新
   * @param patch 状态补丁
   */
  applyPatch(patch: StatePatch): void
  
  /**
   * 订阅状态变化
   * @param path 监听路径
   * @param callback 回调函数
   * @returns 取消订阅函数
   */
  subscribe(path: string, callback: StateChangeCallback): UnsubscribeFunction
  
  /**
   * 回滚到之前状态
   * @param steps 回滚步数
   */
  rollback(steps: number): boolean
  
  /**
   * 验证状态完整性
   */
  validateState(): GameStateValidationResult
}

// ============== AI服务适配器接口 ==============
export interface AIServiceAdapter {
  
  // 基础连接管理
  initialize(config: AIConfig): Promise<void>
  disconnect(): Promise<void>
  
  // 请求处理
  sendRequest(request: AIRequest): Promise<AIResponse>
  testConnection(): Promise<ConnectionTestResult>
  
  // 状态管理
  getConnectionStatus(): ConnectionStatus
  getUsageStats(): UsageStats
  
  // 错误处理
  handleError(error: Error): ProcessedError
}

// ============== 配置管理接口 ==============
export interface ConfigManagerAPI {
  
  /**
   * 保存配置
   * @param type 配置类型
   * @param config 配置数据
   * @returns 配置ID
   */
  saveConfig<T>(type: ConfigType, config: T): Promise<string>
  
  /**
   * 加载配置
   * @param type 配置类型
   * @param id 配置ID
   */
  loadConfig<T>(type: ConfigType, id: string): Promise<T>
  
  /**
   * 删除配置
   * @param type 配置类型
   * @param id 配置ID
   */
  deleteConfig(type: ConfigType, id: string): Promise<boolean>
  
  /**
   * 列出配置
   * @param type 配置类型
   */
  listConfigs(type: ConfigType): Promise<ConfigListItem[]>
  
  /**
   * 验证配置
   * @param type 配置类型
   * @param config 配置数据
   */
  validateConfig<T>(type: ConfigType, config: T): ValidationResult
  
  /**
   * 导出配置
   * @param ids 配置ID列表
   */
  exportConfigs(ids: string[]): Promise<ConfigExport>
  
  /**
   * 导入配置
   * @param data 导入数据
   */
  importConfigs(data: ConfigImport): Promise<ImportResult>
}

// ============== UI渲染接口 ==============
export interface UIRendererAPI {
  
  /**
   * 渲染游戏界面
   * @param gameData 游戏数据
   * @param container 容器元素
   */
  renderGame(gameData: unknown, container: HTMLElement): void
  
  /**
   * 更新界面内容
   * @param updates 更新数据
   */
  updateUI(updates: unknown[]): void
  
  /**
   * 设置主题
   * @param theme 主题配置
   */
  setTheme(theme: unknown): void
  
  /**
   * 切换布局
   * @param layout 布局配置
   */
  switchLayout(layout: unknown): void
  
  /**
   * 添加动画效果
   * @param element 目标元素
   * @param animation 动画配置
   */
  addAnimation(element: HTMLElement, animation: unknown): Promise<void>
  
  /**
   * 清除界面
   */
  clear(): void
}

// ============== 组件渲染接口 ==============
export interface ComponentRendererAPI {
  
  /**
   * 渲染场景组件
   */
  renderScene(scene: string, config: unknown): unknown
  
  /**
   * 渲染旁白组件
   */
  renderNarration(narration: string, config: unknown): unknown
  
  /**
   * 渲染选项组件
   */
  renderOptions(options: unknown[], config: unknown): unknown
  
  /**
   * 渲染状态栏组件
   */
  renderStatusBar(status: unknown, config: unknown): unknown
  
  /**
   * 渲染扩展卡片
   */
  renderExtensionCard(data: unknown, config: unknown): unknown
}

// ============== 存储管理接口 ==============
export interface StorageManagerAPI {
  
  /**
   * 保存数据
   * @param key 存储键
   * @param data 数据
   * @param options 存储选项
   */
  save(key: string, data: unknown, options?: StorageOptions): Promise<boolean>
  
  /**
   * 加载数据
   * @param key 存储键
   */
  load<T>(key: string): Promise<T | null>
  
  /**
   * 删除数据
   * @param key 存储键
   */
  delete(key: string): Promise<boolean>
  
  /**
   * 列出所有键
   */
  listKeys(pattern?: string): Promise<string[]>
  
  /**
   * 清空存储
   */
  clear(): Promise<void>
  
  /**
   * 获取存储统计
   */
  getStats(): Promise<StorageStats>
  
  /**
   * 导出数据
   * @param keys 要导出的键列表
   */
  export(keys: string[]): Promise<unknown>
  
  /**
   * 导入数据
   * @param data 导入数据
   */
  import(data: unknown): Promise<ImportResult>
}

// ============== 事件总线接口 ==============
export interface EventBusAPI {
  
  /**
   * 发布事件
   * @param event 事件名称
   * @param data 事件数据
   * @param options 发布选项
   */
  emit<T>(event: string, data: T, options?: EmitOptions): void
  
  /**
   * 订阅事件
   * @param event 事件名称
   * @param handler 事件处理器
   * @param options 订阅选项
   * @returns 取消订阅函数
   */
  on<T>(event: string, handler: EventHandler<T>, options?: SubscribeOptions): UnsubscribeFunction
  
  /**
   * 一次性订阅
   * @param event 事件名称
   * @param handler 事件处理器
   */
  once<T>(event: string, handler: EventHandler<T>): UnsubscribeFunction
  
  /**
   * 取消订阅
   * @param event 事件名称
   * @param handler 事件处理器
   */
  off<T>(event: string, handler?: EventHandler<T>): void
  
  /**
   * 清除所有订阅
   */
  clear(): void
  
  /**
   * 获取事件统计
   */
  getStats(): EventStats
  
  /**
   * 获取调试信息
   */
  getDebugInfo(): Record<string, unknown>
}

// ============== 事件处理相关类型 ==============
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>

export interface EmitOptions {
  async?: boolean
  timeout?: number
  broadcast?: boolean
}

export interface SubscribeOptions {
  once?: boolean
  priority?: number
  filter?: (data: unknown) => boolean
}

export interface EventStats {
  totalEvents: number
  eventsByType: Record<string, number>
  subscriberCount: number
  averageProcessingTime: number
}

// ============== 全局错误处理器接口 ==============
export interface GlobalErrorHandler {
  
  /**
   * 注册错误处理器
   * @param category 错误分类
   * @param handler 处理器函数
   */
  registerHandler(category: ErrorCategory, handler: ErrorHandler): void
  
  /**
   * 处理错误
   * @param error 错误对象
   * @returns 处理结果
   */
  handleError(error: Error | ProcessedError): ErrorHandleResult
  
  /**
   * 设置错误过滤器
   * @param filter 过滤器函数
   */
  setErrorFilter(filter: ErrorFilter): void
  
  /**
   * 获取错误统计
   */
  getErrorStats(): ErrorMetrics
  
  /**
   * 清除错误记录
   */
  clearErrorHistory(): void
}

export type ErrorHandler = (error: ProcessedError) => ErrorHandleResult
export type ErrorFilter = (error: BaseError) => boolean

// ============== 错误恢复管理器接口 ==============
export interface ErrorRecoveryManager {
  
  /**
   * 执行错误恢复
   * @param error 错误信息
   * @param strategy 恢复策略
   */
  executeRecovery(error: ProcessedError, strategy: RecoveryStrategy): Promise<RecoveryResult>
  
  /**
   * 注册恢复处理器
   * @param strategy 恢复策略
   * @param handler 处理器函数
   */
  registerRecoveryHandler(strategy: RecoveryStrategy, handler: RecoveryHandler): void
  
  /**
   * 创建系统检查点
   */
  createCheckpoint(): Promise<string>
  
  /**
   * 回滚到检查点
   * @param checkpointId 检查点ID
   */
  rollbackToCheckpoint(checkpointId: string): Promise<boolean>
  
  /**
   * 获取恢复历史
   */
  getRecoveryHistory(): RecoveryRecord[]
}

export type RecoveryHandler = (error: ProcessedError, context: unknown) => Promise<RecoveryResult>

// ============== 重试策略接口 ==============
export interface RetryStrategyInterface {
  
  /**
   * 计算延迟时间
   * @param attempt 重试次数
   * @returns 延迟时间(毫秒)
   */
  calculateDelay(attempt: number): number
  
  /**
   * 判断是否应该重试
   * @param attempt 重试次数
   * @param error 错误信息
   * @returns 是否重试
   */
  shouldRetry(attempt: number, error: BaseError): boolean
}

// ============== 性能监控接口 ==============
export interface PerformanceMonitor {
  
  /**
   * 记录API调用性能
   * @param serviceType AI服务类型
   * @param duration 调用耗时(毫秒)
   * @param success 是否成功
   */
  recordAPICall(serviceType: string, duration: number, success: boolean): void
  
  /**
   * 记录渲染性能
   * @param component 组件名称
   * @param renderTime 渲染时间(毫秒)
   */
  recordRenderTime(component: string, renderTime: number): void
  
  /**
   * 记录内存使用
   */
  recordMemoryUsage(): void
  
  /**
   * 获取性能报告
   */
  getPerformanceReport(): PerformanceReport
  
  /**
   * 清除性能数据
   */
  clearPerformanceData(): void
}

export interface PerformanceReport {
  // API性能
  apiPerformance: {
    [serviceType: string]: {
      averageResponseTime: number
      successRate: number
      totalCalls: number
      errorCount: number
    }
  }
  
  // 渲染性能
  renderPerformance: {
    [component: string]: {
      averageRenderTime: number
      maxRenderTime: number
      totalRenders: number
    }
  }
  
  // 内存使用
  memoryUsage: {
    current: number
    peak: number
    average: number
  }
  
  // 存储使用
  storageUsage: {
    total: number
    available: number
    itemCount: number
  }
}

// ============== 缓存管理接口 ==============
export interface CacheManager {
  
  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 生存时间(秒)
   */
  set(key: string, value: unknown, ttl?: number): void
  
  /**
   * 获取缓存
   * @param key 缓存键
   */
  get<T>(key: string): T | null
  
  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): boolean
  
  /**
   * 清空缓存
   */
  clear(): void
  
  /**
   * 获取缓存统计
   */
  getStats(): CacheStats
}

export interface CacheStats {
  totalSize: number
  itemCount: number
  hitRate: number
  missRate: number
  evictionCount: number
}

// ============== 操作接口 ==============
export interface Operation {
  execute(): Promise<unknown>
  abort?(): void
  getProgress?(): number
}

// ============== 错误处理流程接口 ==============
export interface ErrorHandlingFlow {
  
  // 第一步：约束检查
  constraintCheck(input: unknown): ConstraintCheckResult
  
  // 第二步：数据验证
  validate(data: unknown, schema: unknown): ValidationResult
  
  // 第三步：备用方案
  applyFallback(error: BaseError, context: unknown): FallbackResult
  
  // 第四步：重试机制
  executeWithRetry(operation: Operation, config: RetryConfig): Promise<unknown>
}

export interface ConstraintCheckResult {
  passed: boolean
  violations: ConstraintViolation[]
}

export interface ConstraintViolation {
  field: string
  constraint: string
  violatedValue: unknown
  message: string
}

export interface FallbackResult {
  success: boolean
  data?: unknown
  partial: boolean
}

// ============== 模块通信接口 ==============

/**
 * 标准模块接口
 * 根据系统架构设计文档4.2.1节模块接口规范
 */
export interface ModuleInterface {
  name: string
  version: string
  dependencies: string[]
  initialize(): Promise<void>
  destroy(): Promise<void>
  getAPI(): Record<string, (...args: unknown[]) => unknown>
}

/**
 * 模块容器接口
 * 用于模块间依赖注入和管理
 */
export interface ModuleContainer {
  register<T>(name: string, module: T): void
  resolve<T>(name: string): T
  has(name: string): boolean
  unregister(name: string): boolean
  list(): string[]
}

/**
 * 模块生命周期事件
 */
export interface ModuleLifecycleEvents {
  'module:registered': { name: string; module: unknown }
  'module:initialized': { name: string; module: unknown }
  'module:destroyed': { name: string; module: unknown }
  'module:error': { name: string; error: Error }
}






