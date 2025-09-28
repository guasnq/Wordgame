// 配置相关类型定义
// 基于API接口文档的完整配置管理类型系统

import { 
  ConfigType, 
  FieldType, 
  ExtensionType, 
  CardPosition, 
  DataType, 
  DisplayFormat, 
  UpdateFrequency,
  NumberFormat,
  AIServiceType,
  StoragePriority 
} from './enums'

// ============== 世界观配置 ==============
export interface WorldConfig {
  id: string
  name: string
  description: string
  
  // 世界观内容
  background: string          // 世界背景
  rules: string              // 游戏规则
  characters: string         // 角色设定
  setting: string            // 环境设定
  
  // 配置元数据
  tags: string[]             // 标签
  difficulty: number         // 难度等级 (1-5)
  estimatedDuration: number  // 预估时长(分钟)
  
  // 版本信息
  version: string
  createdAt: number
  updatedAt: number
  author?: string
}

// ============== 状态栏配置 ==============
export interface StatusConfig {
  id: string
  name: string
  description: string
  
  // 状态字段定义
  fields: StatusField[]
  
  // 显示配置
  layout: StatusLayoutConfig
  theme: StatusThemeConfig
  
  // 版本信息
  version: string
  createdAt: number
  updatedAt: number
}

export interface StatusField {
  id: string
  name: string              // 内部字段名
  displayName: string       // 显示名称
  type: FieldType           // 字段类型
  
  // 类型特定配置
  config: FieldConfig
  
  // 显示配置
  order: number             // 排序
  visible: boolean          // 是否可见
  required: boolean         // 是否必需
}

export interface FieldConfig {
  [key: string]: any
}

export interface ProgressFieldConfig extends FieldConfig {
  min: number
  max: number
  initial: number
  color: string
  showPercentage: boolean
}

export interface NumberFieldConfig extends FieldConfig {
  initial: number
  min?: number
  max?: number
  format: NumberFormat
}

export interface StatusLayoutConfig {
  columns: number
  spacing: number
  alignment: 'left' | 'center' | 'right'
  grouping: boolean
}

export interface StatusThemeConfig {
  backgroundColor: string
  textColor: string
  borderColor: string
  accentColor: string
}

// ============== AI配置 ==============
export interface AIConfig {
  id: string
  name: string
  serviceType: AIServiceType
  
  // 连接配置
  connection: ConnectionConfig
  
  // 请求配置
  parameters: AIParameters
  
  // 高级配置
  advanced: AdvancedConfig
  
  // 元数据
  version: string
  createdAt: number
  updatedAt: number
}

export interface ConnectionConfig {
  apiUrl: string
  apiKey: string
  model: string
  timeout: number
  maxRetries: number
  retryDelay: number
}

export interface AIParameters {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  stopSequences: string[]
}

export interface AdvancedConfig {
  useStreaming: boolean
  enableCaching: boolean
  cacheExpiration: number
  enableCompression: boolean
  customHeaders: Record<string, string>
  
  // 错误处理
  fallbackModel?: string
  autoSwitchOnError: boolean
  errorThreshold: number
  
  // 性能优化
  connectionPooling: boolean
  keepAlive: boolean
  compressionLevel: number
  
  // 监控和日志
  enableMetrics: boolean
  enableTracing: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  
  // 实验性功能
  experimentalFeatures: {
    enableFunctionCalling: boolean
    enableToolUse: boolean
    enableMultimodalInput: boolean
    enableBatchProcessing: boolean
  }
}

// ============== 扩展配置 ==============
export interface ExtensionConfig {
  id: string
  name: string
  type: ExtensionType
  position: CardPosition
  dataType: DataType
  displayFormat: DisplayFormat
  updateFrequency: UpdateFrequency
  config: ExtensionSpecificConfig
}

export interface ExtensionSpecificConfig {
  [key: string]: any
}

// ============== 预设配置 ==============
export interface PresetConfig {
  id: string
  name: string
  description: string
  
  // 核心配置
  world: WorldConfig
  status: StatusConfig
  ai: AIConfig
  extensions: ExtensionConfig[]
  
  // 界面配置
  theme: ThemeConfig
  layout: LayoutConfig
  
  // 游戏设置
  settings: GameSettings
  
  // 元数据
  version: string
  createdAt: number
  updatedAt: number
  author?: string
  tags: string[]
}

// ============== 主题配置 ==============
export interface ThemeConfig {
  id: string
  name: string
  colors: ColorScheme
  typography: Typography
  animations: AnimationConfig
}

export interface ColorScheme {
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  accent: string
  success: string
  warning: string
  error: string
}

export interface Typography {
  fontFamily: string
  fontSize: {
    small: string
    medium: string
    large: string
    xlarge: string
  }
  fontWeight: {
    normal: number
    medium: number
    bold: number
  }
  lineHeight: number
}

export interface AnimationConfig {
  enabled: boolean
  duration: {
    fast: number
    medium: number
    slow: number
  }
  easing: string
}

// ============== 布局配置 ==============
export interface LayoutConfig {
  type: 'desktop' | 'mobile' | 'adaptive'
  sidebar: SidebarConfig
  header: HeaderConfig
  footer: FooterConfig
}

export interface SidebarConfig {
  enabled: boolean
  position: 'left' | 'right'
  width: number
  collapsible: boolean
}

export interface HeaderConfig {
  enabled: boolean
  height: number
  showTitle: boolean
  showNavigation: boolean
}

export interface FooterConfig {
  enabled: boolean
  height: number
  showInfo: boolean
}

// ============== 游戏设置 ==============
export interface GameSettings {
  autoSave: boolean
  saveInterval: number
  maxHistory: number
  enableAnimations: boolean
  soundEnabled: boolean
  keyboardShortcuts: boolean
  debugMode: boolean
}

// ============== 完整游戏配置 ==============
export interface GameConfiguration {
  id: string
  name: string
  description: string
  
  // 核心配置
  world: WorldConfig
  status: StatusConfig
  ai: AIConfig
  extensions: ExtensionConfig[]
  
  // 界面配置
  theme: ThemeConfig
  layout: LayoutConfig
  
  // 游戏设置
  settings: GameSettings
  
  // 元数据
  version: string
  createdAt: number
  updatedAt: number
  author?: string
  tags: string[]
}

// ============== 配置列表项 ==============
export interface ConfigListItem {
  id: string
  name: string
  description: string
  type: ConfigType
  version: string
  createdAt: number
  updatedAt: number
  size: number
  tags: string[]
}

// ============== 配置导出 ==============
export interface ConfigExport {
  format: string
  version: string
  exportTime: number
  configs: {
    [ConfigType.WORLD]: WorldConfig[]
    [ConfigType.STATUS]: StatusConfig[]
    [ConfigType.AI]: AIConfig[]
    [ConfigType.EXTENSION]: ExtensionConfig[]
    [ConfigType.PRESET]: PresetConfig[]
  }
  metadata: ExportMetadata
}

export interface ExportMetadata {
  totalConfigs: number
  totalSize: number
  checksum: string
  creator: string
  notes?: string
}

// ============== 配置导入 ==============
export interface ConfigImport {
  format: string
  data: ConfigExport
  options: ImportOptions
}

export interface ImportOptions {
  overwriteExisting: boolean
  mergeConfigurations: boolean
  validateData: boolean
  createBackup: boolean
}

export interface ImportResult {
  success: boolean
  imported: ImportSummary
  errors: ImportError[]
  warnings: ImportWarning[]
}

export interface ImportSummary {
  totalProcessed: number
  successful: number
  failed: number
  skipped: number
  details: {
    [ConfigType.WORLD]: number
    [ConfigType.STATUS]: number
    [ConfigType.AI]: number
    [ConfigType.EXTENSION]: number
    [ConfigType.PRESET]: number
  }
}

export interface ImportError {
  configId: string
  configType: ConfigType
  error: string
  details?: string
}

export interface ImportWarning {
  configId: string
  configType: ConfigType
  warning: string
  details?: string
}

// ============== 存储配置 ==============
export interface StorageOptions {
  compress?: boolean
  encrypt?: boolean
  expire?: number
  priority?: StoragePriority
}

export interface StorageStats {
  totalSize: number
  itemCount: number
  availableSpace: number
  lastCleanup: number
}

// ============== 配置模板 ==============
export interface ConfigTemplate {
  id: string
  name: string
  description: string
  category: string
  type: ConfigType
  template: any
  variables: TemplateVariable[]
  version: string
  createdAt: number
}

export interface TemplateVariable {
  key: string
  name: string
  description: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  defaultValue: any
  required: boolean
  validation?: ValidationRule
}

export interface ValidationRule {
  pattern?: string
  min?: number
  max?: number
  options?: string[]
}

// ============== 验证结果 ==============
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}
