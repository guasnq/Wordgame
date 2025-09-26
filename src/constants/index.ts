// 系统常量定义

export const SYSTEM_LIMITS = {
  // 请求处理限制
  maxRequestSize: 2048 * 1024, // 2MB
  maxResponseSize: 1024 * 1024, // 1MB

  // 本地存储限制
  maxLocalStorageSize: 100, // 100MB
  maxSaveFileSize: 20, // 20MB
  maxConfigSize: 200, // 200KB

  // 用户体验优化
  maxHistoryRounds: 200, // 200回合
  maxExtensionCards: 15, // 15个扩展卡片
  maxStatusFields: 30, // 30个状态字段
}

export const ERROR_CODES = {
  // 系统级错误 (1000-1999)
  NETWORK_ERROR: 1000,
  STORAGE_ERROR: 1100,
  MEMORY_ERROR: 1200,

  // 业务级错误 (2000-2999)
  INPUT_VALIDATION_ERROR: 2000,
  STATE_ERROR: 2100,
  CONFIG_ERROR: 2300,

  // AI服务错误 (3000-3999)
  AI_CONNECTION_ERROR: 3000,
  AI_AUTH_ERROR: 3001,
  AI_RATE_LIMIT_ERROR: 3002,
  AI_RESPONSE_ERROR: 3200,

  // DeepSeek特定错误 (3010-3019)
  DEEPSEEK_REASONING_ERROR: 3010,
  DEEPSEEK_KV_CACHE_ERROR: 3011,
  DEEPSEEK_COMPAT_ERROR: 3012,
  DEEPSEEK_TOKEN_ERROR: 3013,

  // Gemini特定错误 (3020-3029)
  GEMINI_SAFETY_ERROR: 3020,
  GEMINI_MULTIMODAL_ERROR: 3021,
  GEMINI_LIVE_ERROR: 3022,
  GEMINI_OAUTH_ERROR: 3023,

  // SiliconFlow特定错误 (3030-3039)
  SILICONFLOW_BALANCE_ERROR: 3030,
  SILICONFLOW_BATCH_ERROR: 3031,
  SILICONFLOW_MODEL_ERROR: 3032,
  SILICONFLOW_VOICE_ERROR: 3033,
} as const

export const AI_PROVIDERS = {
  DEEPSEEK: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    features: ['reasoning', 'kv_cache'],
  },
  GEMINI: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-2.5-flash', 'gemini-pro'],
    features: ['multimodal', 'live_api'],
  },
  SILICONFLOW: {
    name: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: ['qwen-plus', 'glm-4', 'llama-3.1'],
    features: ['batch_processing', 'model_switching'],
  },
} as const
