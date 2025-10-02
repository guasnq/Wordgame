/**
 * 状态快照工具
 * 提供游戏状态的快照、比较、回滚等功能
 * 基于API接口文档3.1.2节StateManager API的要求
 */

import { GameStateSnapshot, GameState } from '@/types/game'
import { CircularBuffer } from './CircularBuffer'

/**
 * 快照管理配置
 */
export interface SnapshotManagerConfig {
  maxSnapshots: number      // 最大快照数量
  autoSnapshot: boolean     // 是否自动创建快照
  autoSnapshotInterval: number // 自动快照间隔（回合数）
  enableCompression: boolean   // 是否启用压缩
  enableChecksums: boolean     // 是否启用校验和
}

/**
 * 状态快照管理器
 */
export class StateSnapshotManager {
  private snapshots: CircularBuffer<GameStateSnapshot>
  private config: SnapshotManagerConfig
  private lastSnapshotRound: number = 0

  constructor(config: Partial<SnapshotManagerConfig> = {}) {
    this.config = {
      maxSnapshots: 50,              // 默认保留50个快照
      autoSnapshot: true,            // 默认启用自动快照
      autoSnapshotInterval: 5,       // 每5回合自动创建快照
      enableCompression: false,      // 默认不压缩（开发阶段）
      enableChecksums: true,         // 默认启用校验和
      ...config
    }

    this.snapshots = new CircularBuffer<GameStateSnapshot>({
      capacity: this.config.maxSnapshots,
      enableCompaction: false  // 快照不需要压缩，直接覆盖即可
    })
  }

  /**
   * 创建游戏状态快照
   * @param gameState 游戏状态
   * @param description 快照描述
   * @returns 快照对象
   */
  createSnapshot(gameState: GameState, description?: string): GameStateSnapshot {
    const timestamp = Date.now()
    const snapshotId = this.generateSnapshotId(timestamp)
    
    // 深度克隆游戏状态以避免引用问题
    const clonedState = this.deepClone(gameState)
    
    const snapshot: GameStateSnapshot = {
      id: snapshotId,
      gameState: clonedState,
      timestamp,
      checksum: this.config.enableChecksums ? this.calculateChecksum(clonedState) : '',
      metadata: {
        description: description || `Round ${gameState.currentRound} snapshot`,
        round: gameState.currentRound,
        size: this.estimateSize(clonedState),
        compressed: false
      }
    }

    // 如果启用压缩，则压缩数据
    if (this.config.enableCompression) {
      snapshot.gameState = this.compressState(snapshot.gameState)
      snapshot.metadata.compressed = true
    }

    this.snapshots.push(snapshot)
    this.lastSnapshotRound = gameState.currentRound

    return snapshot
  }

  /**
   * 自动快照检查
   * @param gameState 当前游戏状态
   * @returns 是否创建了快照
   */
  autoSnapshotCheck(gameState: GameState): boolean {
    if (!this.config.autoSnapshot) return false

    const roundsSinceLastSnapshot = gameState.currentRound - this.lastSnapshotRound
    
    if (roundsSinceLastSnapshot >= this.config.autoSnapshotInterval) {
      this.createSnapshot(gameState, `Auto snapshot at round ${gameState.currentRound}`)
      return true
    }

    return false
  }

  /**
   * 获取指定ID的快照
   * @param snapshotId 快照ID
   * @returns 快照对象或undefined
   */
  getSnapshot(snapshotId: string): GameStateSnapshot | undefined {
    return this.snapshots.find(snapshot => snapshot.id === snapshotId)
  }

  /**
   * 获取最新的快照
   * @returns 最新快照或undefined
   */
  getLatestSnapshot(): GameStateSnapshot | undefined {
    return this.snapshots.latest()
  }

  /**
   * 获取指定回合的快照
   * @param roundNumber 回合号
   * @returns 快照对象或undefined
   */
  getSnapshotByRound(roundNumber: number): GameStateSnapshot | undefined {
    return this.snapshots.find(snapshot => 
      snapshot.metadata?.round === roundNumber
    )
  }

  /**
   * 获取所有快照列表
   * @returns 快照列表（按时间排序）
   */
  getAllSnapshots(): GameStateSnapshot[] {
    return this.snapshots.toArray()
  }

  /**
   * 获取最近的N个快照
   * @param count 快照数量
   * @returns 快照数组
   */
  getRecentSnapshots(count: number): GameStateSnapshot[] {
    return this.snapshots.getLatest(count)
  }

  /**
   * 删除指定快照
   * @param snapshotId 快照ID
   * @returns 是否删除成功
   */
  deleteSnapshot(snapshotId: string): boolean {
    // 注意：CircularBuffer不支持随机删除，这里标记为已删除
    const snapshot = this.getSnapshot(snapshotId)
    if (snapshot) {
      snapshot.metadata = {
        ...snapshot.metadata,
        deleted: true
      }
      return true
    }
    return false
  }

  /**
   * 清除所有快照
   */
  clearSnapshots(): void {
    this.snapshots.clear()
    this.lastSnapshotRound = 0
  }

  /**
   * 验证快照完整性
   * @param snapshot 快照对象
   * @returns 验证结果
   */
  validateSnapshot(snapshot: GameStateSnapshot): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // 检查必需字段
    if (!snapshot.id) errors.push('Missing snapshot ID')
    if (!snapshot.gameState) errors.push('Missing game state')
    if (!snapshot.timestamp) errors.push('Missing timestamp')

    // 检查校验和
    if (this.config.enableChecksums && snapshot.checksum) {
      const currentChecksum = this.calculateChecksum(snapshot.gameState)
      if (currentChecksum !== snapshot.checksum) {
        errors.push('Checksum mismatch - snapshot may be corrupted')
      }
    }

    // 检查时间戳合理性
    if (snapshot.timestamp > Date.now()) {
      errors.push('Invalid timestamp - snapshot from future')
    }

    // 检查状态结构
    const stateErrors = this.validateGameState(snapshot.gameState)
    errors.push(...stateErrors)

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 比较两个快照的差异
   * @param snapshot1 快照1
   * @param snapshot2 快照2
   * @returns 差异报告
   */
  compareSnapshots(snapshot1: GameStateSnapshot, snapshot2: GameStateSnapshot): {
    differences: StateDifference[]
    summary: string
  } {
    const differences: StateDifference[] = []
    
    // 比较基础信息
    if (snapshot1.gameState.currentRound !== snapshot2.gameState.currentRound) {
      differences.push({
        path: 'currentRound',
        oldValue: snapshot1.gameState.currentRound,
        newValue: snapshot2.gameState.currentRound,
        type: 'changed'
      })
    }

    // 比较玩家状态
    this.compareObjects(
      snapshot1.gameState.playerStatus, 
      snapshot2.gameState.playerStatus, 
      'playerStatus', 
      differences
    )

    // 比较扩展数据
    this.compareObjects(
      snapshot1.gameState.customData, 
      snapshot2.gameState.customData, 
      'customData', 
      differences
    )

    const summary = differences.length === 0 
      ? 'No differences found'
      : `Found ${differences.length} difference(s)`

    return { differences, summary }
  }

  /**
   * 获取快照统计信息
   */
  getStatistics(): {
    totalSnapshots: number
    totalSize: string
    oldestSnapshot: Date | null
    newestSnapshot: Date | null
    averageSize: string
  } {
    const allSnapshots = this.getAllSnapshots().filter(s => !s.metadata?.deleted)
    const totalSize = allSnapshots.reduce((sum, s) => sum + (s.metadata?.size || 0), 0)
    
    return {
      totalSnapshots: allSnapshots.length,
      totalSize: this.formatBytes(totalSize),
      oldestSnapshot: allSnapshots.length > 0 ? new Date(allSnapshots[0].timestamp) : null,
      newestSnapshot: allSnapshots.length > 0 ? new Date(allSnapshots[allSnapshots.length - 1].timestamp) : null,
      averageSize: allSnapshots.length > 0 ? this.formatBytes(totalSize / allSnapshots.length) : '0 B'
    }
  }

  // ============== 私有方法 ==============

  private generateSnapshotId(timestamp: number): string {
    return `snapshot_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
  }

  private calculateChecksum(gameState: GameState): string {
    // 简单的校验和计算（实际项目中可能使用更强的哈希算法）
    const str = JSON.stringify(gameState)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转为32位整数
    }
    return hash.toString(16)
  }

  private estimateSize(gameState: GameState): number {
    // 估算对象大小（字节）
    return JSON.stringify(gameState).length
  }

  private compressState(gameState: GameState): GameState {
    // 简单的状态压缩：移除不必要的字段
    const compressed = { ...gameState }
    
    // 压缩历史记录（只保留最近的20回合）
    if (compressed.history && compressed.history.length > 20) {
      compressed.history = compressed.history.slice(-20)
    }

    return compressed
  }

  private validateGameState(gameState: GameState): string[] {
    const errors: string[] = []

    if (!gameState.gameId) errors.push('Missing gameId')
    if (!gameState.worldId) errors.push('Missing worldId')
    if (typeof gameState.currentRound !== 'number') errors.push('Invalid currentRound')
    if (!gameState.playerStatus) errors.push('Missing playerStatus')
    if (!Array.isArray(gameState.history)) errors.push('Invalid history format')

    return errors
  }

  private compareObjects(
    obj1: Record<string, unknown> | undefined,
    obj2: Record<string, unknown> | undefined,
    path: string,
    differences: StateDifference[]
  ): void {
    const keys1 = Object.keys(obj1 ?? {})
    const keys2 = Object.keys(obj2 ?? {})
    const allKeys = new Set([...keys1, ...keys2])

    for (const key of allKeys) {
      const fullPath = `${path}.${key}`
      const val1 = obj1 ? obj1[key] : undefined
      const val2 = obj2 ? obj2[key] : undefined

      if (val1 === undefined && val2 !== undefined) {
        differences.push({
          path: fullPath,
          oldValue: undefined,
          newValue: val2,
          type: 'added'
        })
      } else if (val1 !== undefined && val2 === undefined) {
        differences.push({
          path: fullPath,
          oldValue: val1,
          newValue: undefined,
          type: 'removed'
        })
      } else if (val1 !== val2) {
        differences.push({
          path: fullPath,
          oldValue: val1,
          newValue: val2,
          type: 'changed'
        })
      }
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

/**
 * 状态差异接口
 */
export interface StateDifference {
  path: string
  oldValue: unknown
  newValue: unknown
  type: 'added' | 'removed' | 'changed'
}

/**
 * 扩展快照元数据接口
 */
export interface SnapshotMetadata {
  description?: string
  round?: number
  size?: number
  compressed?: boolean
  deleted?: boolean
  tags?: string[]
}

// 扩展原有的GameStateSnapshot接口
declare module '@/types/game' {
  interface GameStateSnapshot {
    metadata?: SnapshotMetadata
  }
}

