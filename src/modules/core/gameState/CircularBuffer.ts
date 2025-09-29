/**
 * 环形缓冲区实现
 * 用于管理游戏历史记录，支持固定大小的历史存储
 * 基于需求文档5.1节：保留最近200回合的限制
 */

export interface CircularBufferOptions {
  capacity: number
  enableCompaction?: boolean  // 是否启用数据压缩
}

/**
 * 具有回合号的数据项接口
 */
interface RoundData {
  round: number
}

export class CircularBuffer<T> {
  private buffer: (T | undefined)[]
  private head: number = 0    // 指向最新元素
  private tail: number = 0    // 指向最旧元素
  private size: number = 0    // 当前元素数量
  private capacity: number
  private enableCompaction: boolean

  constructor(options: CircularBufferOptions) {
    this.capacity = options.capacity
    this.enableCompaction = options.enableCompaction ?? false
    this.buffer = new Array(this.capacity)
  }

  /**
   * 添加元素到缓冲区
   * @param item 要添加的元素
   * @returns 是否触发了旧数据的移除
   */
  push(item: T): boolean {
    const wasOverwritten = this.size === this.capacity

    this.buffer[this.head] = item
    this.head = (this.head + 1) % this.capacity

    if (this.size < this.capacity) {
      this.size++
    } else {
      // 缓冲区已满，移动tail指针
      this.tail = (this.tail + 1) % this.capacity
    }

    return wasOverwritten
  }

  /**
   * 获取指定位置的元素
   * @param index 索引（0为最旧元素）
   * @returns 元素或undefined
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this.size) {
      return undefined
    }

    const actualIndex = (this.tail + index) % this.capacity
    return this.buffer[actualIndex]
  }

  /**
   * 获取最新的元素
   * @returns 最新元素或undefined
   */
  latest(): T | undefined {
    if (this.size === 0) return undefined
    const latestIndex = (this.head - 1 + this.capacity) % this.capacity
    return this.buffer[latestIndex]
  }

  /**
   * 获取最新的N个元素
   * @param count 元素数量
   * @returns 元素数组（从旧到新）
   */
  getLatest(count: number): T[] {
    const actualCount = Math.min(count, this.size)
    const result: T[] = []

    for (let i = this.size - actualCount; i < this.size; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        result.push(item)
      }
    }

    return result
  }

  /**
   * 获取所有元素
   * @returns 所有元素数组（从旧到新）
   */
  toArray(): T[] {
    const result: T[] = []
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        result.push(item)
      }
    }
    return result
  }

  /**
   * 清空缓冲区
   */
  clear(): void {
    this.buffer.fill(undefined)
    this.head = 0
    this.tail = 0
    this.size = 0
  }

  /**
   * 获取当前大小
   */
  getSize(): number {
    return this.size
  }

  /**
   * 获取容量
   */
  getCapacity(): number {
    return this.capacity
  }

  /**
   * 是否已满
   */
  isFull(): boolean {
    return this.size === this.capacity
  }

  /**
   * 是否为空
   */
  isEmpty(): boolean {
    return this.size === 0
  }

  /**
   * 查找元素
   * @param predicate 查找条件
   * @returns 找到的元素或undefined
   */
  find(predicate: (item: T, index: number) => boolean): T | undefined {
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i)
      if (item !== undefined && predicate(item, i)) {
        return item
      }
    }
    return undefined
  }

  /**
   * 过滤元素
   * @param predicate 过滤条件
   * @returns 符合条件的元素数组
   */
  filter(predicate: (item: T, index: number) => boolean): T[] {
    const result: T[] = []
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i)
      if (item !== undefined && predicate(item, i)) {
        result.push(item)
      }
    }
    return result
  }

  /**
   * 压缩数据（如果启用了压缩功能）
   * 移除一半的最旧数据，保留关键信息
   */
  compact(): void {
    if (!this.enableCompaction || this.size <= this.capacity / 2) {
      return
    }

    const newSize = Math.floor(this.size / 2)
    const newBuffer = new Array(this.capacity)
    let newIndex = 0

    // 保留最新的一半数据
    for (let i = this.size - newSize; i < this.size; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        newBuffer[newIndex] = item
        newIndex++
      }
    }

    this.buffer = newBuffer
    this.head = newIndex
    this.tail = 0
    this.size = newIndex
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): {
    capacity: number
    size: number
    utilizationRate: number
    estimatedMemoryKB: number
  } {
    const itemSizeEstimate = 1 // KB per item (估算)
    return {
      capacity: this.capacity,
      size: this.size,
      utilizationRate: this.size / this.capacity,
      estimatedMemoryKB: this.size * itemSizeEstimate
    }
  }

  /**
   * 创建快照（用于回滚功能）
   */
  createSnapshot(): CircularBufferSnapshot<T> {
    return {
      buffer: [...this.buffer],
      head: this.head,
      tail: this.tail,
      size: this.size,
      capacity: this.capacity,
      timestamp: Date.now()
    }
  }

  /**
   * 从快照恢复
   * @param snapshot 快照数据
   */
  restoreFromSnapshot(snapshot: CircularBufferSnapshot<T>): void {
    if (snapshot.capacity !== this.capacity) {
      throw new Error('Snapshot capacity mismatch')
    }

    this.buffer = [...snapshot.buffer]
    this.head = snapshot.head
    this.tail = snapshot.tail
    this.size = snapshot.size
  }
}

/**
 * 环形缓冲区快照接口
 */
export interface CircularBufferSnapshot<T> {
  buffer: (T | undefined)[]
  head: number
  tail: number
  size: number
  capacity: number
  timestamp: number
}

/**
 * 游戏历史记录专用的环形缓冲区
 * 基于系统配置的200回合限制
 */
export class GameHistoryBuffer<T> extends CircularBuffer<T> {
  constructor(maxRounds: number = 200) {
    super({
      capacity: maxRounds,
      enableCompaction: true
    })
  }

  /**
   * 添加回合记录
   * @param round 回合数据
   * @returns 添加结果信息
   */
  addRound(round: T): {
    added: boolean
    overwritten: boolean
    totalRounds: number
    message?: string
  } {
    const overwritten = this.push(round)
    
    return {
      added: true,
      overwritten,
      totalRounds: this.getSize(),
      message: overwritten 
        ? `已达到${this.getCapacity()}回合限制，最旧的回合已被覆盖`
        : undefined
    }
  }

  /**
   * 获取指定回合的记录
   * @param roundNumber 回合号（从1开始）
   * @returns 回合记录或undefined
   */
  getRoundByNumber(roundNumber: number): T | undefined {
    return this.find((item: T) => (item as T & RoundData).round === roundNumber)
  }

  /**
   * 获取回合范围
   * @returns 最小和最大回合号
   */
  getRoundRange(): { min: number; max: number } | null {
    if (this.isEmpty()) return null

    const firstRound = this.get(0) as (T & RoundData) | undefined
    const lastRound = this.latest() as (T & RoundData) | undefined

    return {
      min: firstRound?.round || 1,
      max: lastRound?.round || 1
    }
  }

  /**
   * 检查是否需要数据压缩
   * @returns 是否需要压缩
   */
  needsCompaction(): boolean {
    return this.isFull() && this.getSize() > 100 // 超过100回合时考虑压缩
  }
}