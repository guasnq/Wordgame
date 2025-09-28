// 枚举定义
// 根据API接口文档定义的各种枚举类型

// ============== 用户输入类型 ==============
export enum UserInputType {
  TEXT_INPUT = 'text_input',      // 文本输入
  OPTION_CLICK = 'option_click',  // 选项点击
  SHORTCUT_KEY = 'shortcut_key',  // 快捷键
  VOICE_INPUT = 'voice_input'     // 语音输入(预留)
}

// ============== AI服务商类型 ==============
export enum AIServiceType {
  OPENAI = 'openai',             // OpenAI GPT系列
  CLAUDE = 'claude',             // Anthropic Claude系列
  DEEPSEEK = 'deepseek',         // DeepSeek系列
  GEMINI = 'gemini',             // Google Gemini系列
  SILICONFLOW = 'siliconflow'    // SiliconFlow系列
}

export enum AIProvider {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  DEEPSEEK = 'deepseek',
  GEMINI = 'gemini',
  SILICONFLOW = 'siliconflow'
}

// ============== 状态字段类型 ==============
export enum FieldType {
  PROGRESS = 'progress',          // 进度条类型
  NUMBER = 'number',              // 数值类型
  TEXT = 'text',                  // 文本类型
  LEVEL = 'level'                 // 等级类型
}

export enum NumberFormat {
  INTEGER = 'integer',            // 整数
  DECIMAL = 'decimal',            // 小数
  PERCENTAGE = 'percentage',      // 百分比
  CURRENCY = 'currency'           // 货币
}

// ============== 扩展卡片类型 ==============
export enum ExtensionType {
  LIST = 'list',                  // 列表类型
  KEY_VALUE = 'key_value',        // 键值对类型
  PROGRESS = 'progress',          // 进度类型
  CHART = 'chart',               // 图表类型
  CUSTOM = 'custom'              // 自定义类型
}

export enum CardPosition {
  LEFT = 'left',                  // 左侧
  RIGHT = 'right',                // 右侧
  TOP = 'top',                    // 顶部
  BOTTOM = 'bottom'               // 底部
}

export enum DataType {
  ARRAY = 'array',                // 数组类型
  OBJECT = 'object',              // 对象类型
  MIXED = 'mixed'                 // 混合类型
}

export enum DisplayFormat {
  LIST = 'list',                  // 列表格式
  TABLE = 'table',                // 表格格式
  CARD = 'card',                  // 卡片格式
  GRID = 'grid'                   // 网格格式
}

export enum UpdateFrequency {
  REAL_TIME = 'real_time',        // 实时更新
  ON_CHANGE = 'on_change',        // 变化时更新
  MANUAL = 'manual',              // 手动更新
  PERIODIC = 'periodic'           // 定期更新
}

// ============== 配置类型 ==============
export enum ConfigType {
  WORLD = 'world',                // 世界观配置
  STATUS = 'status',              // 状态栏配置
  AI = 'ai',                      // AI配置
  EXTENSION = 'extension',        // 扩展配置
  PRESET = 'preset'               // 预设配置
}

// ============== 错误严重程度 ==============
export enum ErrorSeverity {
  CRITICAL = 'critical',          // 致命错误：系统无法继续运行
  HIGH = 'high',                  // 高级错误：核心功能不可用
  MEDIUM = 'medium',              // 中级错误：部分功能受影响
  LOW = 'low',                    // 低级错误：用户体验受影响
  INFO = 'info'                   // 信息级：仅记录，不影响功能
}

export enum ErrorCategory {
  NETWORK = 'network',            // 网络相关
  AI_SERVICE = 'ai_service',      // AI服务相关
  VALIDATION = 'validation',      // 验证相关
  STORAGE = 'storage',            // 存储相关
  CONFIG = 'config',              // 配置相关
  GAME_LOGIC = 'game_logic',      // 游戏逻辑相关
  UI = 'ui',                      // 界面相关
  SYSTEM = 'system'               // 系统相关
}

export enum RecoveryStrategy {
  RETRY = 'retry',                // 重试操作
  FALLBACK = 'fallback',          // 使用备用方案
  RESET = 'reset',                // 重置状态
  IGNORE = 'ignore',              // 忽略错误
  USER_ACTION = 'user_action'     // 需要用户操作
}

export enum RetryStrategy {
  NONE = 'none',                  // 不重试
  IMMEDIATE = 'immediate',        // 立即重试
  FIXED_DELAY = 'fixed_delay',    // 固定延迟
  EXPONENTIAL = 'exponential',    // 指数退避
  LINEAR = 'linear',              // 线性增长
  CUSTOM = 'custom'               // 自定义策略
}

// ============== 熔断器状态 ==============
export enum CircuitBreakerState {
  CLOSED = 'closed',              // 正常状态
  OPEN = 'open',                  // 熔断状态
  HALF_OPEN = 'half_open'         // 半开状态
}

// ============== 存储相关 ==============
export enum StoragePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// ============== 游戏事件 ==============
export enum GameEvent {
  // 游戏流程事件
  GAME_STARTED = 'game:started',
  GAME_PAUSED = 'game:paused',
  GAME_RESUMED = 'game:resumed',
  GAME_ENDED = 'game:ended',
  
  // 回合事件
  ROUND_STARTED = 'round:started',
  ROUND_COMPLETED = 'round:completed',
  
  // 状态事件
  STATE_CHANGED = 'state:changed',
  STATUS_UPDATED = 'status:updated',
  
  // AI事件
  AI_REQUEST_SENT = 'ai:request_sent',
  AI_RESPONSE_RECEIVED = 'ai:response_received',
  AI_ERROR_OCCURRED = 'ai:error',
  
  // UI事件
  UI_RENDERED = 'ui:rendered',
  UI_UPDATED = 'ui:updated',
  
  // 配置事件
  CONFIG_CHANGED = 'config:changed',
  CONFIG_SAVED = 'config:saved',
  
  // 存储事件
  DATA_SAVED = 'storage:saved',
  DATA_LOADED = 'storage:loaded',
  DATA_EXPORTED = 'storage:exported'
}

// ============== SiliconFlow特定服务 ==============
export enum SiliconFlowService {
  CHAT = 'chat',                  // 聊天完成
  EMBEDDING = 'embedding',        // 文本嵌入
  RERANKER = 'reranker',          // 重排序
  IMAGE_GEN = 'image_gen',        // 图像生成
  SPEECH = 'speech',              // 语音服务
  VIDEO = 'video'                 // 视频生成
}

// ============== 解析阶段 ==============
export enum ParseStage {
  RAW_EXTRACTION = 'raw_extraction',      // 原始提取
  JSON_PARSING = 'json_parsing',          // JSON解析
  VALIDATION = 'validation',              // 验证
  FIELD_MAPPING = 'field_mapping',        // 字段映射
  SANITIZATION = 'sanitization',          // 数据清理
  FALLBACK = 'fallback'                   // 降级处理
}

// ============== 日志级别 ==============
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// ============== 告警严重程度 ==============
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}