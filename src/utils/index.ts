// 基础工具函数库
// 基于API接口文档 7.3节 测试工具类

import { ERROR_CODES, SYSTEM_LIMITS } from '../constants'

/**
 * 延时工具函数
 */
export class DelayUtils {
  /**
   * 等待指定时间
   * @param ms 毫秒数
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 等待条件满足
   * @param condition 条件函数
   * @param timeout 超时时间（毫秒）
   * @param interval 检查间隔（毫秒）
   */
  static async waitFor(
    condition: () => boolean,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const start = Date.now()
    
    while (!condition()) {
      if (Date.now() - start > timeout) {
        throw new Error(`Condition not met within ${timeout}ms`)
      }
      await this.wait(interval)
    }
  }

  /**
   * 防抖函数
   * @param func 要防抖的函数
   * @param delay 延迟时间
   */
  static debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }

  /**
   * 节流函数
   * @param func 要节流的函数
   * @param delay 延迟时间
   */
  static throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, delay)
      }
    }
  }
}

/**
 * 数据验证工具
 */
export class ValidationUtils {
  /**
   * 验证必填字段
   * @param obj 对象
   * @param requiredFields 必填字段列表
   */
  static validateRequired(obj: Record<string, unknown>, requiredFields: string[]): string[] {
    const errors: string[] = []
    
    for (const field of requiredFields) {
      if (!Object.prototype.hasOwnProperty.call(obj, field) || obj[field] === null || obj[field] === undefined) {
        errors.push(`缺少必填字段: ${field}`)
      }
    }
    
    return errors
  }

  /**
   * 验证字段类型
   * @param obj 对象
   * @param fieldTypes 字段类型映射
   */
  static validateTypes(obj: Record<string, unknown>, fieldTypes: Record<string, string>): string[] {
    const errors: string[] = []
    
    for (const [field, expectedType] of Object.entries(fieldTypes)) {
      if (Object.prototype.hasOwnProperty.call(obj, field)) {
        const actualType = typeof obj[field]
        if (actualType !== expectedType) {
          errors.push(`字段 ${field} 类型错误: 期望 ${expectedType}, 实际 ${actualType}`)
        }
      }
    }
    
    return errors
  }

  /**
   * 验证数据大小限制
   * @param data 数据
   * @param maxSize 最大大小（字节）
   */
  static validateSize(data: string | object, maxSize: number): boolean {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data)
    const size = new Blob([jsonString]).size
    return size <= maxSize
  }

  /**
   * 验证JSON格式
   * @param jsonString JSON字符串
   */
  static validateJSON(jsonString: string): { isValid: boolean; error?: string } {
    try {
      JSON.parse(jsonString)
      return { isValid: true }
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : '未知JSON解析错误' 
      }
    }
  }

  /**
   * 验证配置对象
   * @param config 配置对象
   * @param schema 配置架构
   */
  static validateConfig<T extends Record<string, unknown>>(config: T, schema: ConfigSchema): ValidationResult {
    const errors: string[] = []
    
    // 验证必填字段
    if (schema.required) {
      errors.push(...this.validateRequired(config, schema.required))
    }
    
    // 验证字段类型
    if (schema.types) {
      errors.push(...this.validateTypes(config, schema.types))
    }
    
    // 验证大小限制
    if (schema.maxSize && !this.validateSize(config, schema.maxSize)) {
      errors.push(`配置大小超过限制: ${schema.maxSize} 字节`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * 格式化工具
 */
export class FormatUtils {
  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @param decimals 小数位数
   */
  static formatFileSize(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  /**
   * 格式化时间
   * @param timestamp 时间戳
   * @param format 格式类型
   */
  static formatTime(timestamp: number, format: 'relative' | 'absolute' = 'relative'): string {
    const now = Date.now()
    const diff = now - timestamp
    
    if (format === 'relative') {
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
      return `${Math.floor(diff / 86400000)}天前`
    }
    
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  /**
   * 格式化百分比
   * @param value 当前值
   * @param max 最大值
   * @param decimals 小数位数
   */
  static formatPercentage(value: number, max: number, decimals: number = 1): string {
    const percentage = (value / max) * 100
    return `${percentage.toFixed(decimals)}%`
  }

  /**
   * 截断文本
   * @param text 文本
   * @param maxLength 最大长度
   * @param suffix 后缀
   */
  static truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - suffix.length) + suffix
  }
}

/**
 * 存储工具
 */
export class StorageUtils {
  /**
   * 安全的本地存储读取
   * @param key 存储键
   * @param defaultValue 默认值
   */
  static getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn('读取本地存储失败:', error)
      return defaultValue
    }
  }

  /**
   * 安全的本地存储写入
   * @param key 存储键
   * @param value 值
   */
  static setItem<T>(key: string, value: T): boolean {
    try {
      const jsonString = JSON.stringify(value)
      
      // 检查大小限制
      if (!ValidationUtils.validateSize(jsonString, SYSTEM_LIMITS.maxConfigSize)) {
        console.warn('存储数据过大:', FormatUtils.formatFileSize(new Blob([jsonString]).size))
        return false
      }
      
      localStorage.setItem(key, jsonString)
      return true
    } catch (error) {
      console.error('写入本地存储失败:', error)
      return false
    }
  }

  /**
   * 移除存储项
   * @param key 存储键
   */
  static removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('删除本地存储失败:', error)
      return false
    }
  }

  /**
   * 清理过期数据
   * @param pattern 键名模式
   * @param maxAge 最大存活时间（毫秒）
   */
  static cleanupExpired(pattern: string, maxAge: number): number {
    let cleaned = 0
    const now = Date.now()
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes(pattern)) {
          const data = this.getItem(key, null)
          if (data && typeof data === 'object' && data !== null && 'timestamp' in data) {
            const timestamp = (data as { timestamp: unknown }).timestamp
            if (typeof timestamp === 'number' && now - timestamp > maxAge) {
              localStorage.removeItem(key)
              cleaned++
            }
          }
        }
      }
    } catch (error) {
      console.error('清理过期数据失败:', error)
    }
    
    return cleaned
  }

  /**
   * 获取存储使用情况
   */
  static getStorageInfo(): StorageInfo {
    try {
      let used = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key)
          if (value) {
            used += new Blob([value]).size
          }
        }
      }
      
      // 估算配额（大多数浏览器为5-10MB）
      const quota = SYSTEM_LIMITS.maxLocalStorageSize
      
      return {
        used,
        quota,
        available: quota - used,
        percentage: (used / quota) * 100
      }
    } catch (error) {
      console.error('获取存储信息失败:', error)
      return {
        used: 0,
        quota: SYSTEM_LIMITS.maxLocalStorageSize,
        available: SYSTEM_LIMITS.maxLocalStorageSize,
        percentage: 0
      }
    }
  }
}

/**
 * 错误处理工具
 */
export class ErrorUtils {
  /**
   * 创建标准错误对象
   * @param code 错误码
   * @param message 错误消息
   * @param details 错误详情
   */
  static createError(code: number, message: string, details?: unknown): StandardError {
    return {
      code,
      message,
      details,
      timestamp: Date.now(),
      stack: new Error().stack
    }
  }

  /**
   * 判断是否为网络错误
   * @param error 错误对象
   */
  static isNetworkError(error: unknown): boolean {
    const networkCodes = [
      ERROR_CODES.CONNECTION_FAILED,
      ERROR_CODES.CONNECTION_TIMEOUT,
      ERROR_CODES.DNS_RESOLUTION_FAILED,
      ERROR_CODES.NETWORK_UNREACHABLE
    ]
    
    return error && typeof error === 'object' && 'code' in error && networkCodes.includes((error as { code: unknown }).code as number)
  }

  /**
   * 判断是否为可重试错误
   * @param error 错误对象
   */
  static isRetryableError(error: unknown): boolean {
    const retryableCodes = [
      ERROR_CODES.CONNECTION_TIMEOUT,
      ERROR_CODES.AI_REQUEST_TIMEOUT,
      ERROR_CODES.AI_RATE_LIMIT_ERROR,
      ERROR_CODES.TOO_MANY_REQUESTS
    ]
    
    return error && typeof error === 'object' && 'code' in error && retryableCodes.includes((error as { code: unknown }).code as number)
  }

  /**
   * 获取用户友好的错误消息
   * @param error 错误对象
   */
  static getUserFriendlyMessage(error: unknown): string {
    const errorMap: Record<number, string> = {
      [ERROR_CODES.CONNECTION_FAILED]: '网络连接失败，请检查网络设置',
      [ERROR_CODES.CONNECTION_TIMEOUT]: '连接超时，请稍后重试',
      [ERROR_CODES.AI_AUTH_ERROR]: 'AI服务认证失败，请检查API密钥',
      [ERROR_CODES.AI_RATE_LIMIT_ERROR]: 'API调用频率过高，请稍后重试',
      [ERROR_CODES.QUOTA_EXCEEDED]: '存储空间不足，请清理缓存',
      [ERROR_CODES.CONFIG_INVALID]: '配置格式无效，请检查配置文件'
    }
    
    if (error && typeof error === 'object') {
      const errorObj = error as { code?: number; message?: string }
      return errorMap[errorObj.code ?? 0] || errorObj.message || '未知错误'
    }
    return '未知错误'
  }
}

/**
 * 类型定义
 */
export interface ConfigSchema {
  required?: string[]
  types?: Record<string, string>
  maxSize?: number
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface StorageInfo {
  used: number
  quota: number
  available: number
  percentage: number
}

export interface StandardError {
  code: number
  message: string
  details?: unknown
  timestamp: number
  stack?: string
}

// 导出所有工具类
export { DelayUtils, ValidationUtils, FormatUtils, StorageUtils, ErrorUtils }