// 系统常量定义

/**
 * 系统限制配置
 * 基于API接口文档 6.2节 数据大小限制
 */
export const SYSTEM_LIMITS = {
  // 请求处理限制
  maxRequestSize: 2048 * 1024, // 2MB（支持更大的多模态输入）
  maxResponseSize: 1024 * 1024, // 1MB（支持更长的AI响应）

  // 本地存储限制（受浏览器限制）
  maxLocalStorageSize: 100 * 1024 * 1024, // 100MB
  maxSaveFileSize: 20 * 1024 * 1024, // 20MB
  maxConfigSize: 200 * 1024, // 200KB

  // 用户体验优化
  maxHistoryRounds: 200, // 200回合
  maxExtensionCards: 15, // 15个扩展卡片
  maxStatusFields: 30, // 30个状态字段

  // 网络超时设置
  requestTimeout: 30000, // 30秒
  connectionTimeout: 10000, // 10秒
  retryDelay: 1000, // 1秒基础重试延迟

  // 性能限制
  maxConcurrentRequests: 3, // 最大并发请求数
  maxCacheSize: 50 * 1024 * 1024, // 50MB缓存大小
} as const

/**
 * 完整的错误码定义
 * 基于错误分类与重试策略文档 1节 错误分类体系
 */
export const ERROR_CODES = {
  // ===== 系统级错误 (1000-1999) =====
  // 网络错误 (1000-1099)
  CONNECTION_FAILED: 1000,
  CONNECTION_TIMEOUT: 1001,
  DNS_RESOLUTION_FAILED: 1002,
  SSL_HANDSHAKE_FAILED: 1003,
  PROXY_ERROR: 1004,
  NETWORK_UNREACHABLE: 1005,
  CONNECTION_RESET: 1006,
  TOO_MANY_REQUESTS: 1007,
  BANDWIDTH_EXCEEDED: 1008,
  FIREWALL_BLOCKED: 1009,

  // 存储错误 (1100-1199)
  QUOTA_EXCEEDED: 1100,
  ACCESS_DENIED: 1101,
  ITEM_NOT_FOUND: 1102,
  CORRUPTION_DETECTED: 1103,
  WRITE_FAILED: 1104,
  READ_FAILED: 1105,
  DELETE_FAILED: 1106,
  LOCK_TIMEOUT: 1107,
  TRANSACTION_FAILED: 1108,
  BACKUP_FAILED: 1109,

  // 内存错误 (1200-1299)
  OUT_OF_MEMORY: 1200,
  MEMORY_LEAK: 1201,
  BUFFER_OVERFLOW: 1202,
  STACK_OVERFLOW: 1203,

  // 配置错误 (1300-1399)
  CONFIG_MISSING: 1300,
  CONFIG_INVALID: 1301,
  CONFIG_VERSION_MISMATCH: 1302,

  // ===== 业务级错误 (2000-2999) =====
  // 输入验证错误 (2000-2099)
  INPUT_VALIDATION_ERROR: 2000,
  FIELD_REQUIRED: 2001,
  FIELD_TYPE_INVALID: 2002,
  FIELD_LENGTH_EXCEEDED: 2003,
  FIELD_FORMAT_INVALID: 2004,
  FIELD_VALUE_OUT_OF_RANGE: 2005,

  // 状态错误 (2100-2199)
  STATE_ERROR: 2100,
  INVALID_STATE_TRANSITION: 2101,
  STATE_CORRUPTION: 2102,
  STATE_CONFLICT: 2103,

  // 权限错误 (2200-2299)
  PERMISSION_DENIED: 2200,
  UNAUTHORIZED_ACCESS: 2201,
  INSUFFICIENT_PRIVILEGES: 2202,

  // 逻辑错误 (2300-2399)
  LOGIC_ERROR: 2300,
  BUSINESS_RULE_VIOLATION: 2301,
  WORKFLOW_ERROR: 2302,

  // ===== AI服务错误 (3000-3999) =====
  // 通用AI调用错误 (3000-3099)
  AI_CONNECTION_ERROR: 3000,
  AI_AUTH_ERROR: 3001,
  AI_RATE_LIMIT_ERROR: 3002,
  AI_SERVICE_UNAVAILABLE: 3003,
  AI_REQUEST_TIMEOUT: 3004,
  AI_QUOTA_EXCEEDED: 3005,
  AI_MODEL_NOT_FOUND: 3006,
  AI_INVALID_REQUEST: 3007,
  AI_CONTENT_FILTERED: 3008,
  AI_TOKEN_LIMIT_EXCEEDED: 3009,

  // DeepSeek特定错误 (3010-3019)
  DEEPSEEK_INVALID_KEY_ERROR: 3010,
  DEEPSEEK_RATE_LIMIT_ERROR: 3011,
  DEEPSEEK_KV_CACHE_ERROR: 3012,
  DEEPSEEK_REASONING_ERROR: 3013,
  DEEPSEEK_COMPAT_ERROR: 3014,
  DEEPSEEK_TOKEN_ERROR: 3015,

  // Gemini特定错误 (3020-3029)
  GEMINI_SAFETY_ERROR: 3020,
  GEMINI_MULTIMODAL_ERROR: 3021,
  GEMINI_LIVE_ERROR: 3022,
  GEMINI_OAUTH_ERROR: 3023,
  GEMINI_CONTEXT_CACHE_ERROR: 3024,

  // SiliconFlow特定错误 (3030-3039)
  SILICONFLOW_BALANCE_ERROR: 3030,
  SILICONFLOW_BATCH_ERROR: 3031,
  SILICONFLOW_MODEL_ERROR: 3032,
  SILICONFLOW_VOICE_ERROR: 3033,
  SILICONFLOW_SERVICE_ERROR: 3034,

  // AI响应解析错误 (3200-3299)
  AI_RESPONSE_ERROR: 3200,
  INVALID_JSON: 3201,
  MISSING_REQUIRED_FIELD: 3202,
  FIELD_TYPE_MISMATCH: 3203,
  FIELD_VALUE_INVALID: 3204,
  STRUCTURE_INVALID: 3205,
  ENCODING_ERROR: 3206,
  CONTENT_TRUNCATED: 3207,
  LANGUAGE_DETECTION_FAILED: 3208,
  SYNONYM_MAPPING_FAILED: 3209,
  FALLBACK_PARSE_FAILED: 3210,

  // ===== 用户界面错误 (4000-4999) =====
  // 渲染错误 (4000-4099)
  COMPONENT_MOUNT_FAILED: 4000,
  COMPONENT_UPDATE_FAILED: 4001,
  TEMPLATE_COMPILE_FAILED: 4002,
  STYLE_LOAD_FAILED: 4003,
  RESOURCE_LOAD_FAILED: 4004,
  ANIMATION_FAILED: 4005,
  LAYOUT_CALCULATION_FAILED: 4006,
  EVENT_BINDING_FAILED: 4007,
  MEMORY_LEAK_DETECTED: 4008,
  PERFORMANCE_DEGRADED: 4009,

  // 交互错误 (4100-4199)
  INPUT_HANDLER_ERROR: 4100,
  EVENT_PROPAGATION_ERROR: 4101,
  GESTURE_RECOGNITION_ERROR: 4102,
  TOUCH_EVENT_ERROR: 4103,
} as const

/**
 * AI服务提供商配置
 * 基于系统架构设计文档中的AI服务集成
 */
export const AI_PROVIDERS = {
  DEEPSEEK: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    features: ['reasoning', 'kv_cache', 'openai_compatible'],
    pricing: '优惠',
    stability: '良好',
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 100000,
    },
  },
  GEMINI: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-2.5-flash', 'gemini-pro', 'gemini-pro-vision'],
    features: ['multimodal', 'live_api', 'context_cache', 'safety_filter'],
    pricing: '中等',
    stability: '优秀',
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 32000,
    },
  },
  SILICONFLOW: {
    name: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: ['qwen-plus', 'qwen-turbo', 'glm-4', 'llama-3.1-405b', 'llama-3.1-70b'],
    features: ['batch_processing', 'model_switching', 'balance_check', 'multiple_models'],
    pricing: '灵活',
    stability: '良好',
    rateLimit: {
      requestsPerMinute: 120,
      tokensPerMinute: 200000,
    },
  },
} as const

/**
 * 重试策略配置
 * 基于错误分类与重试策略文档 3节 重试策略框架
 */
export const RETRY_STRATEGIES = {
  NONE: {
    name: 'none',
    maxAttempts: 0,
    baseDelay: 0,
    maxDelay: 0,
  },
  IMMEDIATE: {
    name: 'immediate',
    maxAttempts: 3,
    baseDelay: 0,
    maxDelay: 0,
  },
  FIXED_DELAY: {
    name: 'fixed_delay',
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 1000,
  },
  EXPONENTIAL: {
    name: 'exponential',
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    multiplier: 2,
    jitter: true,
  },
  LINEAR: {
    name: 'linear',
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  },
} as const

/**
 * 默认配置常量
 * 基于API接口文档 6.2节 系统配置参数
 */
export const DEFAULT_CONFIG = {
  // 游戏配置
  game: {
    maxHistoryLength: 100,
    autoSave: true,
    autoSaveInterval: 30000, // 30秒
    enableDebugMode: false,
  },
  
  // AI配置
  ai: {
    defaultProvider: 'DEEPSEEK' as keyof typeof AI_PROVIDERS,
    temperature: 0.8,
    maxTokens: 2048,
    topP: 0.95,
    presencePenalty: 0.0,
    frequencyPenalty: 0.0,
    timeout: 30000,
    enableStreaming: false,
  },
  
  // UI配置
  ui: {
    theme: 'auto', // 'light' | 'dark' | 'auto'
    language: 'zh-CN',
    layout: 'desktop', // 'desktop' | 'mobile'
    animationDuration: 300,
    enableAnimations: true,
    enableSounds: false,
  },
  
  // 存储配置
  storage: {
    enableCompression: true,
    enableEncryption: false,
    maxStorageSize: 50 * 1024 * 1024, // 50MB
    cleanupInterval: 86400000, // 24小时
  },
  
  // 错误处理配置
  error: {
    enableErrorReporting: false,
    maxErrorLogSize: 1024 * 1024, // 1MB
    defaultRetryStrategy: 'EXPONENTIAL',
    enableFallback: true,
  },
} as const

/**
 * 字段类型定义
 * 基于API接口文档 3.2.3节 状态栏配置接口
 */
export const FIELD_TYPES = {
  PROGRESS: 'progress',
  NUMBER: 'number', 
  TEXT: 'text',
  LEVEL: 'level',
} as const

/**
 * 扩展卡片类型
 * 基于需求文档中的扩展卡片系统
 */
export const EXTENSION_CARD_TYPES = {
  LIST: 'list',
  KEY_VALUE: 'key_value',
  PROGRESS: 'progress',
  CUSTOM: 'custom',
} as const

/**
 * 游戏状态常量
 */
export const GAME_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  PLAYING: 'playing',
  PAUSED: 'paused',
  ERROR: 'error',
  ENDED: 'ended',
} as const

/**
 * 事件类型常量
 */
export const EVENT_TYPES = {
  GAME_START: 'game:start',
  GAME_END: 'game:end',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_RESET: 'game:reset',
  
  USER_INPUT: 'user:input',
  USER_OPTION_SELECT: 'user:option_select',
  
  AI_REQUEST_START: 'ai:request_start',
  AI_REQUEST_SUCCESS: 'ai:request_success',
  AI_REQUEST_ERROR: 'ai:request_error',
  
  UI_UPDATE: 'ui:update',
  UI_ERROR: 'ui:error',
  
  CONFIG_CHANGE: 'config:change',
  CONFIG_SAVE: 'config:save',
  CONFIG_LOAD: 'config:load',
} as const

/**
 * 本地存储键名常量
 */
export const STORAGE_KEYS = {
  // 配置存储
  WORLD_CONFIG: 'wordgame:world_config',
  STATUS_CONFIG: 'wordgame:status_config', 
  AI_CONFIG: 'wordgame:ai_config',
  UI_CONFIG: 'wordgame:ui_config',
  
  // 游戏数据
  GAME_STATE: 'wordgame:game_state',
  GAME_HISTORY: 'wordgame:game_history',
  SAVE_DATA: 'wordgame:save_data',
  
  // 缓存
  AI_RESPONSE_CACHE: 'wordgame:ai_cache',
  PRESET_CACHE: 'wordgame:preset_cache',
  
  // 用户偏好
  USER_PREFERENCES: 'wordgame:user_preferences',
  ERROR_LOGS: 'wordgame:error_logs',
} as const
