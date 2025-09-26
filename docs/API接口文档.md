# AI文字游戏渲染器 - API接口文档

## 目录
- [1. API概览和架构](#1-api概览和架构)
- [2. 外部AI服务接口](#2-外部ai服务接口)
- [3. 内部模块接口](#3-内部模块接口)
- [4. 数据结构定义](#4-数据结构定义)
- [5. 错误码和异常处理](#5-错误码和异常处理)
- [6. 性能和限制说明](#6-性能和限制说明)
- [7. 开发和测试指南](#7-开发和测试指南)

---

## 1. API概览和架构

### 1.1 系统整体架构

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   用户界面层     │    │   业务逻辑层     │    │   数据存储层     │
│                  │    │                  │    │                  │
│ • 界面组件       │◄──►│ • 游戏引擎       │◄──►│ • 本地存储       │
│ • 用户交互       │    │ • 状态管理       │    │ • 缓存系统       │
│ • 事件处理       │    │ • 配置管理       │    │ • 导入导出       │
└──────────────────┘    └──────────────────┘    └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │   AI服务集成层   │
                        │                  │
                        │ • OpenAI适配器   │
                        │ • Claude适配器   │
                        │ • 国产AI适配器   │
                        └──────────────────┘
```

### 1.2 核心API分类

| API类别 | 用途 | 主要接口 |
|---------|------|----------|
| **GameEngine API** | 游戏核心逻辑 | `processUserInput()`, `updateGameState()` |
| **AIService API** | AI服务集成 | `sendRequest()`, `parseResponse()` |
| **ConfigManager API** | 配置管理 | `saveConfig()`, `loadConfig()` |
| **StorageManager API** | 数据存储 | `save()`, `load()`, `export()` |
| **UIRenderer API** | 界面渲染 | `render()`, `update()` |
| **EventBus API** | 事件通信 | `emit()`, `on()`, `off()` |

### 1.3 数据流向图

```
[用户输入] → [InputProcessor] → [GameEngine] → [AIService] → [外部AI]
     ↓              ↓              ↓            ↓
[UIRenderer] ← [StorageManager] ← [EventBus] ← [ResponseParser]
```

---

## 2. 外部AI服务接口

### 2.1 统一AI服务接口

#### 2.1.1 AIServiceAdapter 接口定义

```typescript
interface AIServiceAdapter {
  // 基础连接管理
  initialize(config: AIConfig): Promise<void>;
  disconnect(): Promise<void>;
  
  // 请求处理
  sendRequest(request: AIRequest): Promise<AIResponse>;
  testConnection(): Promise<ConnectionTestResult>;
  
  // 状态管理
  getConnectionStatus(): ConnectionStatus;
  getUsageStats(): UsageStats;
  
  // 错误处理
  handleError(error: Error): ProcessedError;
}
```

#### 2.1.2 请求格式

**AIRequest 数据结构：**
```typescript
interface AIRequest {
  id: string;                    // 请求唯一标识
  prompt: string;                // 完整的提示词
  config: RequestConfig;         // 请求配置
  metadata: RequestMetadata;     // 请求元数据
  timestamp: number;             // 请求时间戳
}

interface RequestConfig {
  temperature: number;           // 创造性控制 (0-1)
  maxTokens: number;            // 最大返回token数
  timeout: number;              // 超时时间(毫秒)
  retryAttempts: number;        // 重试次数
  stream: boolean;              // 是否流式返回
}

interface RequestMetadata {
  gameRound: number;            // 游戏回合数
  worldId: string;              // 世界观ID
  statusConfig: StatusConfig;   // 状态配置
  extensions: ExtensionConfig[]; // 扩展配置
}
```

#### 2.1.3 响应格式

**AIResponse 数据结构：**
```typescript
interface AIResponse {
  id: string;                   // 对应请求ID
  success: boolean;             // 请求是否成功
  data?: ParsedGameData;        // 解析后的游戏数据
  error?: APIError;             // 错误信息
  metadata: ResponseMetadata;   // 响应元数据
  timestamp: number;            // 响应时间戳
}

interface ParsedGameData {
  scene: string;                // 场景描述
  narration: string;            // 旁白内容
  options: GameOption[];        // 游戏选项
  status: GameStatus;           // 游戏状态
  custom: CustomData;           // 自定义扩展数据
}

interface ResponseMetadata {
  processingTime: number;       // 处理时间(毫秒)
  tokenUsage: TokenUsage;       // Token使用量
  modelUsed: string;            // 使用的模型
  apiVersion: string;           // API版本
}
```

### 2.2 DeepSeek 适配器

#### 2.2.1 DeepSeek API 集成

```typescript
class DeepSeekAdapter implements AIServiceAdapter {
  
  /**
   * 初始化DeepSeek连接
   */
  async initialize(config: DeepSeekConfig): Promise<void> {
    this.headers = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'WordGame-Renderer/1.0'
    };
    
    this.baseURL = 'https://api.deepseek.com';
    await this.testConnection();
  }
  
  /**
   * 发送请求到DeepSeek
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    try {
      const deepseekRequest = this.buildDeepSeekRequest(request);
      const response = await this.makeHTTPRequest(deepseekRequest);
      return this.parseDeepSeekResponse(response, request.id);
      
    } catch (error) {
      return this.createErrorResponse(request.id, error);
    }
  }
  
  /**
   * 构建DeepSeek请求体
   */
  private buildDeepSeekRequest(request: AIRequest): DeepSeekRequestBody {
    return {
      model: this.config.model || 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: request.prompt
        }
      ],
      temperature: request.config.temperature,
      max_tokens: request.config.maxTokens,
      stream: request.config.stream || false
    };
  }
  
  /**
   * 处理DeepSeek推理模型（deepseek-reasoner）
   */
  private async handleReasoningModel(request: AIRequest): Promise<AIResponse> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model: 'deepseek-reasoner',
        messages: [{ role: 'user', content: request.prompt }],
        stream: request.config.stream
      })
    });
    
    if (request.config.stream) {
      return this.parseStreamingResponse(response, request.id);
    }
    
    const data = await response.json();
    const reasoningContent = data.choices[0]?.message?.reasoning_content;
    const content = data.choices[0]?.message?.content;
    
    return this.buildAIResponse(request.id, content, data, reasoningContent);
  }
}
```

### 2.3 SiliconFlow 适配器

#### 2.3.1 SiliconFlow API 集成

```typescript
class SiliconFlowAdapter implements AIServiceAdapter {
  
  /**
   * 初始化SiliconFlow连接
   */
  async initialize(config: SiliconFlowConfig): Promise<void> {
    this.headers = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    };
    
    this.baseURL = 'https://api.siliconflow.cn/v1';
    await this.testConnection();
  }
  
  /**
   * 发送请求到SiliconFlow
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    try {
      const siliconFlowRequest = this.buildSiliconFlowRequest(request);
      const response = await this.makeHTTPRequest(siliconFlowRequest);
      return this.parseSiliconFlowResponse(response, request.id);
      
    } catch (error) {
      return this.createErrorResponse(request.id, error);
    }
  }
  
  /**
   * 构建SiliconFlow请求体
   */
  private buildSiliconFlowRequest(request: AIRequest): SiliconFlowRequestBody {
    return {
      model: this.config.model,
      messages: [
        {
          role: 'user',
          content: request.prompt
        }
      ],
      temperature: request.config.temperature,
      max_tokens: request.config.maxTokens,
      stream: request.config.stream || false
    };
  }
  
  /**
   * 获取用户账户信息（余额查询）
   */
  async getUserInfo(): Promise<UserInfo> {
    const response = await fetch(`${this.baseURL}/user/info`, {
      method: 'GET',
      headers: this.headers
    });
    
    const data = await response.json();
    return {
      balance: data.data.balance,
      totalBalance: data.data.totalBalance,
      chargeBalance: data.data.chargeBalance,
      status: data.data.status
    };
  }
}
```

### 2.4 Gemini 适配器

#### 2.4.1 Gemini API v2.5 集成

```typescript
class GeminiAdapter implements AIServiceAdapter {
  
  /**
   * 初始化Gemini连接
   */
  async initialize(config: GeminiConfig): Promise<void> {
    this.headers = {
      'x-goog-api-key': config.apiKey,
      'Content-Type': 'application/json'
    };
    
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = config.model || 'gemini-2.5-flash';
    await this.testConnection();
  }
  
  /**
   * 发送请求到Gemini
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    try {
      const geminiRequest = this.buildGeminiRequest(request);
      const endpoint = request.config.stream 
        ? `${this.baseURL}/models/${this.model}:streamGenerateContent`
        : `${this.baseURL}/models/${this.model}:generateContent`;
        
      const response = await this.makeHTTPRequest(endpoint, geminiRequest);
      
      if (request.config.stream) {
        return this.parseStreamingResponse(response, request.id);
      }
      
      return this.parseGeminiResponse(response, request.id);
      
    } catch (error) {
      return this.createErrorResponse(request.id, error);
    }
  }
  
  /**
   * 构建Gemini请求体
   */
  private buildGeminiRequest(request: AIRequest): GeminiRequestBody {
    return {
      contents: [
        {
          parts: [
            {
              text: request.prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: request.config.temperature,
        maxOutputTokens: request.config.maxTokens
      }
    };
  }
  
  /**
   * 监控Token使用情况
   */
  private extractTokenUsage(response: any): TokenUsage {
    const usageMetadata = response.usageMetadata;
    if (usageMetadata) {
      return {
        promptTokens: usageMetadata.promptTokenCount || 0,
        completionTokens: usageMetadata.candidatesTokenCount || 0,
        totalTokens: usageMetadata.totalTokenCount || 0
      };
    }
    
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }
}
```

---

## 3. 内部模块接口

### 3.1 游戏引擎核心接口

#### 3.1.1 GameEngine API

```typescript
interface GameEngineAPI {
  
  /**
   * 处理用户输入
   * @param input 用户输入数据
   * @returns 处理结果
   */
  processUserInput(input: UserInput): Promise<ProcessResult>;
  
  /**
   * 更新游戏状态
   * @param updates 状态更新数据
   */
  updateGameState(updates: StateUpdate[]): void;
  
  /**
   * 获取当前游戏状态
   * @returns 当前游戏状态
   */
  getCurrentState(): GameState;
  
  /**
   * 开始新游戏
   * @param config 游戏配置
   */
  startNewGame(config: GameConfiguration): Promise<void>;
  
  /**
   * 保存游戏进度
   * @returns 保存结果
   */
  saveGameProgress(): Promise<SaveResult>;
  
  /**
   * 加载游戏进度
   * @param saveData 存档数据
   */
  loadGameProgress(saveData: SaveData): Promise<LoadResult>;
}
```

**使用示例：**
```typescript
// 处理用户输入
const input: UserInput = {
  type: 'user_input',
  content: '我想向北走',
  timestamp: Date.now()
};

const result = await gameEngine.processUserInput(input);
if (result.success) {
  console.log('处理成功:', result.data);
} else {
  console.error('处理失败:', result.error);
}
```

#### 3.1.2 StateManager API

```typescript
interface StateManagerAPI {
  
  /**
   * 获取状态快照
   */
  getSnapshot(): GameStateSnapshot;
  
  /**
   * 应用状态更新
   * @param patch 状态补丁
   */
  applyPatch(patch: StatePatch): void;
  
  /**
   * 订阅状态变化
   * @param path 监听路径
   * @param callback 回调函数
   * @returns 取消订阅函数
   */
  subscribe(path: string, callback: StateChangeCallback): UnsubscribeFunction;
  
  /**
   * 回滚到之前状态
   * @param steps 回滚步数
   */
  rollback(steps: number): boolean;
  
  /**
   * 验证状态完整性
   */
  validateState(): ValidationResult;
}
```

**数据结构定义：**
```typescript
interface GameState {
  // 基础游戏信息
  gameId: string;
  worldId: string;
  currentRound: number;
  totalRounds: number;
  
  // 玩家状态
  playerStatus: Record<string, any>;  // 动态状态字段
  
  // 游戏历史
  history: GameRound[];
  
  // 当前回合数据
  currentRound: {
    scene: string;
    narration: string;
    options: GameOption[];
    userInput?: string;
    timestamp: number;
  };
  
  // 扩展数据
  customData: Record<string, any>;
  
  // 元数据
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
  };
}
```

### 3.2 配置管理接口

#### 3.2.1 ConfigManager API

```typescript
interface ConfigManagerAPI {
  
  /**
   * 保存配置
   * @param type 配置类型
   * @param config 配置数据
   * @returns 配置ID
   */
  saveConfig<T>(type: ConfigType, config: T): Promise<string>;
  
  /**
   * 加载配置
   * @param type 配置类型
   * @param id 配置ID
   */
  loadConfig<T>(type: ConfigType, id: string): Promise<T>;
  
  /**
   * 删除配置
   * @param type 配置类型
   * @param id 配置ID
   */
  deleteConfig(type: ConfigType, id: string): Promise<boolean>;
  
  /**
   * 列出配置
   * @param type 配置类型
   */
  listConfigs(type: ConfigType): Promise<ConfigListItem[]>;
  
  /**
   * 验证配置
   * @param type 配置类型
   * @param config 配置数据
   */
  validateConfig<T>(type: ConfigType, config: T): ValidationResult;
  
  /**
   * 导出配置
   * @param ids 配置ID列表
   */
  exportConfigs(ids: string[]): Promise<ConfigExport>;
  
  /**
   * 导入配置
   * @param data 导入数据
   */
  importConfigs(data: ConfigImport): Promise<ImportResult>;
}
```

**配置类型枚举：**
```typescript
enum ConfigType {
  WORLD = 'world',           // 世界观配置
  STATUS = 'status',         // 状态栏配置
  AI = 'ai',                 // AI配置
  EXTENSION = 'extension',   // 扩展配置
  PRESET = 'preset'          // 预设配置
}
```

#### 3.2.2 世界观配置接口

```typescript
interface WorldConfig {
  id: string;
  name: string;
  description: string;
  
  // 世界观内容
  background: string;        // 世界背景
  rules: string;            // 游戏规则
  characters: string;       // 角色设定
  setting: string;          // 环境设定
  
  // 配置元数据
  tags: string[];           // 标签
  difficulty: number;       // 难度等级 (1-5)
  estimatedDuration: number; // 预估时长(分钟)
  
  // 版本信息
  version: string;
  createdAt: number;
  updatedAt: number;
  author?: string;
}
```

#### 3.2.3 状态栏配置接口

```typescript
interface StatusConfig {
  id: string;
  name: string;
  description: string;
  
  // 状态字段定义
  fields: StatusField[];
  
  // 显示配置
  layout: StatusLayoutConfig;
  theme: StatusThemeConfig;
  
  // 版本信息
  version: string;
  createdAt: number;
  updatedAt: number;
}

interface StatusField {
  id: string;
  name: string;              // 内部字段名
  displayName: string;       // 显示名称
  type: FieldType;           // 字段类型
  
  // 类型特定配置
  config: FieldConfig;
  
  // 显示配置
  order: number;             // 排序
  visible: boolean;          // 是否可见
  required: boolean;         // 是否必需
}

enum FieldType {
  PROGRESS = 'progress',     // 进度条类型
  NUMBER = 'number',         // 数值类型
  TEXT = 'text',            // 文本类型
  LEVEL = 'level'           // 等级类型
}

interface ProgressFieldConfig extends FieldConfig {
  min: number;              // 最小值
  max: number;              // 最大值
  initial: number;          // 初始值
  color: string;            // 进度条颜色
  showPercentage: boolean;  // 显示百分比
}

interface NumberFieldConfig extends FieldConfig {
  initial: number;          // 初始值
  min?: number;             // 最小值(可选)
  max?: number;             // 最大值(可选)
  format: NumberFormat;     // 数字格式
}
```

### 3.3 UI渲染接口

#### 3.3.1 UIRenderer API

```typescript
interface UIRendererAPI {
  
  /**
   * 渲染游戏界面
   * @param gameData 游戏数据
   * @param container 容器元素
   */
  renderGame(gameData: ParsedGameData, container: HTMLElement): void;
  
  /**
   * 更新界面内容
   * @param updates 更新数据
   */
  updateUI(updates: UIUpdate[]): void;
  
  /**
   * 设置主题
   * @param theme 主题配置
   */
  setTheme(theme: Theme): void;
  
  /**
   * 切换布局
   * @param layout 布局配置
   */
  switchLayout(layout: LayoutConfig): void;
  
  /**
   * 添加动画效果
   * @param element 目标元素
   * @param animation 动画配置
   */
  addAnimation(element: HTMLElement, animation: AnimationConfig): Promise<void>;
  
  /**
   * 清除界面
   */
  clear(): void;
}
```

#### 3.3.2 组件渲染接口

```typescript
interface ComponentRendererAPI {
  
  /**
   * 渲染场景组件
   */
  renderScene(scene: string, config: SceneConfig): ReactElement;
  
  /**
   * 渲染旁白组件
   */
  renderNarration(narration: string, config: NarrationConfig): ReactElement;
  
  /**
   * 渲染选项组件
   */
  renderOptions(options: GameOption[], config: OptionConfig): ReactElement;
  
  /**
   * 渲染状态栏组件
   */
  renderStatusBar(status: GameStatus, config: StatusConfig): ReactElement;
  
  /**
   * 渲染扩展卡片
   */
  renderExtensionCard(data: any, config: ExtensionConfig): ReactElement;
}
```

### 3.4 存储管理接口

#### 3.4.1 StorageManager API

```typescript
interface StorageManagerAPI {
  
  /**
   * 保存数据
   * @param key 存储键
   * @param data 数据
   * @param options 存储选项
   */
  save(key: string, data: any, options?: StorageOptions): Promise<boolean>;
  
  /**
   * 加载数据
   * @param key 存储键
   */
  load<T>(key: string): Promise<T | null>;
  
  /**
   * 删除数据
   * @param key 存储键
   */
  delete(key: string): Promise<boolean>;
  
  /**
   * 列出所有键
   */
  listKeys(pattern?: string): Promise<string[]>;
  
  /**
   * 清空存储
   */
  clear(): Promise<void>;
  
  /**
   * 获取存储统计
   */
  getStats(): Promise<StorageStats>;
  
  /**
   * 导出数据
   * @param keys 要导出的键列表
   */
  export(keys: string[]): Promise<ExportData>;
  
  /**
   * 导入数据
   * @param data 导入数据
   */
  import(data: ImportData): Promise<ImportResult>;
}

interface StorageOptions {
  compress?: boolean;        // 是否压缩
  encrypt?: boolean;         // 是否加密
  expire?: number;           // 过期时间(毫秒)
  priority?: StoragePriority; // 存储优先级
}

interface StorageStats {
  totalSize: number;         // 总大小(字节)
  itemCount: number;         // 项目数量
  availableSpace: number;    // 可用空间
  lastCleanup: number;       // 上次清理时间
}
```

### 3.5 事件总线接口

#### 3.5.1 EventBus API

```typescript
interface EventBusAPI {
  
  /**
   * 发布事件
   * @param event 事件名称
   * @param data 事件数据
   * @param options 发布选项
   */
  emit<T>(event: string, data: T, options?: EmitOptions): void;
  
  /**
   * 订阅事件
   * @param event 事件名称
   * @param handler 事件处理器
   * @param options 订阅选项
   * @returns 取消订阅函数
   */
  on<T>(event: string, handler: EventHandler<T>, options?: SubscribeOptions): UnsubscribeFunction;
  
  /**
   * 一次性订阅
   * @param event 事件名称
   * @param handler 事件处理器
   */
  once<T>(event: string, handler: EventHandler<T>): UnsubscribeFunction;
  
  /**
   * 取消订阅
   * @param event 事件名称
   * @param handler 事件处理器
   */
  off<T>(event: string, handler?: EventHandler<T>): void;
  
  /**
   * 清除所有订阅
   */
  clear(): void;
  
  /**
   * 获取事件统计
   */
  getStats(): EventStats;
}

// 核心游戏事件
enum GameEvent {
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
```

---

## 4. 数据结构定义

### 4.1 游戏数据结构

#### 4.1.1 用户输入数据

```typescript
interface UserInput {
  id: string;                   // 输入ID
  type: UserInputType;          // 输入类型
  content: string;              // 输入内容
  timestamp: number;            // 输入时间戳
  metadata?: InputMetadata;     // 输入元数据
}

enum UserInputType {
  TEXT_INPUT = 'text_input',    // 文本输入
  OPTION_CLICK = 'option_click', // 选项点击
  SHORTCUT_KEY = 'shortcut_key', // 快捷键
  VOICE_INPUT = 'voice_input'   // 语音输入(预留)
}

interface InputMetadata {
  optionId?: string;            // 选项ID(选项点击时)
  shortcutKey?: string;         // 快捷键(快捷键时)
  inputMethod?: string;         // 输入方法
  deviceType?: string;          // 设备类型
}
```

#### 4.1.2 游戏选项数据

```typescript
interface GameOption {
  id: string;                   // 选项ID (A/B/C)
  text: string;                 // 选项文本
  description?: string;         // 选项描述
  enabled: boolean;             // 是否可用
  shortcut?: string;            // 快捷键
  icon?: string;                // 图标
  metadata?: OptionMetadata;    // 选项元数据
}

interface OptionMetadata {
  type?: string;                // 选项类型
  difficulty?: number;          // 难度等级
  consequences?: string[];      // 可能后果
  requirements?: string[];      // 前置条件
}
```

#### 4.1.3 游戏状态数据

```typescript
interface GameStatus {
  [fieldName: string]: StatusFieldValue;
}

type StatusFieldValue = number | ProgressValue | TextValue | LevelValue;

interface ProgressValue {
  value: number;                // 当前值
  max: number;                  // 最大值
  color?: string;               // 显示颜色
  label?: string;               // 显示标签
}

interface TextValue {
  value: string;                // 文本值
  format?: string;              // 格式化规则
}

interface LevelValue {
  level: number;                // 当前等级
  experience: number;           // 当前经验
  nextLevelExp: number;         // 下级所需经验
  maxLevel?: number;            // 最大等级
}
```

#### 4.1.4 自定义扩展数据

```typescript
interface CustomData {
  [cardName: string]: any;      // 已配置的扩展卡片数据
  _extra?: Record<string, any>; // 未配置的额外数据
}

// 扩展卡片配置
interface ExtensionConfig {
  id: string;                   // 扩展ID
  name: string;                 // 扩展名称
  type: ExtensionType;          // 扩展类型
  position: CardPosition;       // 显示位置
  dataType: DataType;           // 数据类型
  displayFormat: DisplayFormat; // 显示格式
  updateFrequency: UpdateFrequency; // 更新频率
  config: ExtensionSpecificConfig; // 扩展特定配置
}

enum ExtensionType {
  LIST = 'list',               // 列表类型
  KEY_VALUE = 'key_value',     // 键值对类型
  PROGRESS = 'progress',       // 进度类型
  CHART = 'chart',             // 图表类型
  CUSTOM = 'custom'            // 自定义类型
}

enum CardPosition {
  LEFT = 'left',               // 左侧
  RIGHT = 'right',             // 右侧
  TOP = 'top',                 // 顶部
  BOTTOM = 'bottom'            // 底部
}

enum DataType {
  ARRAY = 'array',             // 数组类型
  OBJECT = 'object',           // 对象类型
  MIXED = 'mixed'              // 混合类型
}
```

### 4.2 配置数据结构

#### 4.2.1 完整游戏配置

```typescript
interface GameConfiguration {
  id: string;                   // 配置ID
  name: string;                 // 配置名称
  description: string;          // 配置描述
  
  // 核心配置
  world: WorldConfig;           // 世界观配置
  status: StatusConfig;         // 状态栏配置
  ai: AIConfig;                 // AI配置
  extensions: ExtensionConfig[]; // 扩展配置
  
  // 界面配置
  theme: ThemeConfig;           // 主题配置
  layout: LayoutConfig;         // 布局配置
  
  // 游戏设置
  settings: GameSettings;       // 游戏设置
  
  // 元数据
  version: string;              // 配置版本
  createdAt: number;            // 创建时间
  updatedAt: number;            // 更新时间
  author?: string;              // 作者
  tags: string[];               // 标签
}

interface GameSettings {
  autoSave: boolean;            // 自动保存
  saveInterval: number;         // 保存间隔(秒)
  maxHistory: number;           // 最大历史记录数
  enableAnimations: boolean;    // 启用动画
  soundEnabled: boolean;        // 启用音效
  keyboardShortcuts: boolean;   // 启用快捷键
  debugMode: boolean;           // 调试模式
}
```

#### 4.2.2 AI配置数据

```typescript
interface AIConfig {
  id: string;                   // 配置ID
  name: string;                 // 配置名称
  serviceType: AIServiceType;   // 服务类型
  
  // 连接配置
  connection: ConnectionConfig; // 连接配置
  
  // 请求配置
  parameters: AIParameters;     // AI参数
  
  // 高级配置
  advanced: AdvancedConfig;     // 高级配置
  
  // 元数据
  version: string;
  createdAt: number;
  updatedAt: number;
}

enum AIServiceType {
  OPENAI = 'openai',           // OpenAI GPT系列
  CLAUDE = 'claude',           // Anthropic Claude系列 
  DEEPSEEK = 'deepseek',       // DeepSeek系列
  GEMINI = 'gemini',           // Google Gemini系列
  SILICONFLOW = 'siliconflow'  // SiliconFlow系列
}

// DeepSeek特定配置
interface DeepSeekConfig extends ConnectionConfig {
  supportReasoning: boolean;    // 是否支持推理模式
  enableCache: boolean;        // 是否启用缓存
  cacheStrategy: 'auto' | 'manual'; // 缓存策略
  compatibilityMode: 'openai' | 'anthropic' | 'native'; // 兼容模式
}

// Gemini特定配置  
interface GeminiConfig extends ConnectionConfig {
  authType: 'api_key' | 'oauth2'; // 认证类型
  projectId?: string;          // 项目ID（OAuth2需要）
  enableMultimodal: boolean;   // 是否启用多模态
  liveApiEnabled: boolean;     // 是否启用Live API
}

// SiliconFlow特定配置
interface SiliconFlowConfig extends ConnectionConfig {
  serviceTypes: SiliconFlowService[]; // 启用的服务类型
  batchEnabled: boolean;       // 是否启用批处理
  voiceEnabled: boolean;       // 是否启用语音功能
  balanceThreshold: number;    // 余额预警阈值
}

enum SiliconFlowService {
  CHAT = 'chat',              // 聊天完成
  EMBEDDING = 'embedding',     // 文本嵌入
  RERANKER = 'reranker',      // 重排序
  IMAGE_GEN = 'image_gen',    // 图像生成
  SPEECH = 'speech',          // 语音服务
  VIDEO = 'video'             // 视频生成
}

interface ConnectionConfig {
  apiUrl: string;               // API地址
  apiKey: string;               // API密钥
  model: string;                // 使用模型
  timeout: number;              // 超时时间
  maxRetries: number;           // 最大重试次数
  retryDelay: number;           // 重试延迟
}

// 扩展的连接配置，包含最新API特性
interface ExtendedConnectionConfig extends ConnectionConfig {
  // 通用配置
  userAgent: string;            // 用户代理
  customHeaders: Record<string, string>; // 自定义请求头
  
  // DeepSeek特定
  deepseekConfig?: {
    baseUrl: string;            // 默认: https://api.deepseek.com
    anthropicCompatible: boolean; // 是否使用Anthropic兼容端点
    cacheEnabled: boolean;      // 是否启用KV缓存
  };
  
  // Gemini特定
  geminiConfig?: {
    baseUrl: string;            // 默认: https://generativelanguage.googleapis.com/v1beta
    enableSafetySettings: boolean; // 启用安全设置
    safetyThreshold: 'low' | 'medium' | 'high'; // 安全阈值
  };
  
  // SiliconFlow特定
  siliconFlowConfig?: {
    baseUrl: string;            // 默认: https://api.siliconflow.cn/v1
    enableBalanceCheck: boolean; // 启用余额检查
    autoRetryOnQuotaExceeded: boolean; // 配额超限时自动重试
  };
}

interface AIParameters {
  temperature: number;          // 创造性 (0-1)
  maxTokens: number;            // 最大token数
  topP: number;                 // 核采样参数
  frequencyPenalty: number;     // 频率惩罚
  presencePenalty: number;      // 存在惩罚
  stopSequences: string[];      // 停止序列
  
  // 扩展参数（根据不同服务商支持情况）
  topK?: number;                // Top-K采样（Gemini支持）
  repetitionPenalty?: number;   // 重复惩罚（DeepSeek支持）
  systemPrompt?: string;        // 系统提示词
  responseFormat?: 'text' | 'json' | 'structured'; // 响应格式
  
  // DeepSeek特定参数
  enableReasoning?: boolean;    // 启用推理模式（deepseek-reasoner）
  reasoningDepth?: number;      // 推理深度
  
  // Gemini特定参数
  candidateCount?: number;      // 候选回答数量
  safetySettings?: SafetySetting[]; // 安全设置
  
  // SiliconFlow特定参数
  stream?: boolean;             // 是否启用流式输出
  enableCustomVoice?: boolean;  // 是否启用自定义语音（语音服务）
}

interface SafetySetting {
  category: 'HARM_CATEGORY_HARASSMENT' | 'HARM_CATEGORY_HATE_SPEECH' | 'HARM_CATEGORY_SEXUALLY_EXPLICIT' | 'HARM_CATEGORY_DANGEROUS_CONTENT';
  threshold: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
}

interface AdvancedConfig {
  useStreaming: boolean;        // 使用流式返回
  enableCaching: boolean;       // 启用缓存
  cacheExpiration: number;      // 缓存过期时间
  enableCompression: boolean;   // 启用压缩
  customHeaders: Record<string, string>; // 自定义请求头
  
  // 错误处理
  fallbackModel?: string;       // 备用模型
  autoSwitchOnError: boolean;   // 错误时自动切换
  errorThreshold: number;       // 错误阈值
  
  // 性能优化
  connectionPooling: boolean;   // 连接池
  keepAlive: boolean;          // 保持连接
  compressionLevel: number;     // 压缩级别 (0-9)
  
  // 监控和日志
  enableMetrics: boolean;       // 启用指标收集
  enableTracing: boolean;       // 启用请求跟踪
  logLevel: 'debug' | 'info' | 'warn' | 'error'; // 日志级别
  
  // 实验性功能
  experimentalFeatures: {
    enableFunctionCalling: boolean;    // 启用函数调用
    enableToolUse: boolean;           // 启用工具使用
    enableMultimodalInput: boolean;   // 启用多模态输入
    enableBatchProcessing: boolean;   // 启用批处理
  };
}
```

### 4.3 存储数据结构

#### 4.3.1 存档数据

```typescript
interface SaveData {
  id: string;                   // 存档ID
  name: string;                 // 存档名称
  description?: string;         // 存档描述
  
  // 游戏数据
  gameState: GameState;         // 游戏状态
  configuration: GameConfiguration; // 游戏配置
  
  // 统计数据
  statistics: GameStatistics;   // 游戏统计
  
  // 元数据
  metadata: SaveMetadata;       // 存档元数据
}

interface GameStatistics {
  totalPlayTime: number;        // 总游戏时间(秒)
  totalRounds: number;          // 总回合数
  totalInputs: number;          // 总输入次数
  averageRoundTime: number;     // 平均回合时间
  aiRequestCount: number;       // AI请求次数
  totalTokensUsed: number;      // 总token使用量
  achievementsUnlocked: string[]; // 解锁成就
  customStats: Record<string, any>; // 自定义统计
}

interface SaveMetadata {
  version: string;              // 存档版本
  gameVersion: string;          // 游戏版本
  platform: string;            // 平台信息
  createdAt: number;            // 创建时间
  updatedAt: number;            // 更新时间
  fileSize: number;             // 文件大小
  checksum: string;             // 校验和
}
```

#### 4.3.2 导入导出数据

```typescript
interface ExportData {
  format: string;               // 导出格式版本
  exportTime: number;           // 导出时间
  
  // 导出内容
  saves: SaveData[];            // 存档数据
  configurations: GameConfiguration[]; // 配置数据
  templates: ConfigTemplate[];  // 模板数据
  
  // 元数据
  metadata: ExportMetadata;     // 导出元数据
}

interface ImportData {
  format: string;               // 数据格式版本
  data: ExportData;             // 导入数据
  options: ImportOptions;       // 导入选项
}

interface ImportOptions {
  overwriteExisting: boolean;   // 覆盖已存在项
  mergeConfigurations: boolean; // 合并配置
  validateData: boolean;        // 验证数据
  createBackup: boolean;        // 创建备份
}

interface ImportResult {
  success: boolean;             // 导入是否成功
  imported: ImportSummary;      // 导入摘要
  errors: ImportError[];        // 导入错误
  warnings: ImportWarning[];    // 导入警告
}
```

---

## 5. 错误码和异常处理

### 5.1 统一错误码定义

```typescript
enum ErrorCode {
  // 通用错误 (1000-1999)
  UNKNOWN_ERROR = 1000,
  INVALID_PARAMETER = 1001,
  MISSING_PARAMETER = 1002,
  VALIDATION_FAILED = 1003,
  PERMISSION_DENIED = 1004,
  OPERATION_TIMEOUT = 1005,
  
  // 网络错误 (2000-2999)
  NETWORK_ERROR = 2000,
  CONNECTION_FAILED = 2001,
  REQUEST_TIMEOUT = 2002,
  RATE_LIMIT_EXCEEDED = 2003,
  SERVICE_UNAVAILABLE = 2004,
  
  // AI服务错误 (3000-3999)
  AI_SERVICE_ERROR = 3000,
  INVALID_API_KEY = 3001,
  MODEL_NOT_FOUND = 3002,
  QUOTA_EXCEEDED = 3003,
  CONTENT_FILTERED = 3004,
  RESPONSE_PARSE_ERROR = 3005,
  PROMPT_TOO_LONG = 3006,
  
  // DeepSeek特定错误 (3100-3199)
  DEEPSEEK_CACHE_ERROR = 3100,        // KV缓存错误
  DEEPSEEK_REASONING_FAILED = 3101,   // 推理模式失败
  DEEPSEEK_TOKEN_CALC_ERROR = 3102,   // Token计算错误
  
  // Gemini特定错误 (3200-3299)  
  GEMINI_SAFETY_FILTERED = 3200,      // 安全过滤
  GEMINI_MULTIMODAL_ERROR = 3201,     // 多模态处理错误
  GEMINI_LIVE_API_ERROR = 3202,       // Live API错误
  GEMINI_OAUTH_ERROR = 3203,          // OAuth认证错误
  
  // SiliconFlow特定错误 (3300-3399)
  SILICONFLOW_BATCH_ERROR = 3300,     // 批处理错误
  SILICONFLOW_VOICE_ERROR = 3301,     // 语音服务错误
  SILICONFLOW_BALANCE_ERROR = 3302,   // 余额不足错误
  SILICONFLOW_MODEL_SWITCH_ERROR = 3303, // 模型切换错误
  
  // 配置错误 (4000-4999)
  CONFIG_ERROR = 4000,
  INVALID_CONFIG_FORMAT = 4001,
  CONFIG_NOT_FOUND = 4002,
  CONFIG_VALIDATION_FAILED = 4003,
  INCOMPATIBLE_CONFIG_VERSION = 4004,
  
  // 存储错误 (5000-5999)
  STORAGE_ERROR = 5000,
  STORAGE_FULL = 5001,
  DATA_NOT_FOUND = 5002,
  DATA_CORRUPTION = 5003,
  SAVE_FAILED = 5004,
  LOAD_FAILED = 5005,
  
  // 游戏逻辑错误 (6000-6999)
  GAME_ERROR = 6000,
  INVALID_GAME_STATE = 6001,
  GAME_NOT_INITIALIZED = 6002,
  INVALID_USER_INPUT = 6003,
  GAME_ALREADY_ENDED = 6004,
  
  // UI错误 (7000-7999)
  UI_ERROR = 7000,
  RENDER_FAILED = 7001,
  COMPONENT_NOT_FOUND = 7002,
  THEME_LOAD_FAILED = 7003,
  ANIMATION_ERROR = 7004
}
```

### 5.2 错误处理接口

```typescript
interface ProcessedError {
  code: ErrorCode;              // 错误码
  message: string;              // 错误消息
  details?: string;             // 错误详情
  severity: ErrorSeverity;      // 严重程度
  category: ErrorCategory;      // 错误分类
  recovery: RecoveryStrategy;   // 恢复策略
  userMessage: string;          // 用户友好消息
  timestamp: number;            // 发生时间
  context?: ErrorContext;       // 错误上下文
  stack?: string;               // 错误堆栈
}

enum ErrorSeverity {
  LOW = 'low',                  // 低级错误，不影响使用
  MEDIUM = 'medium',            // 中级错误，影响部分功能
  HIGH = 'high',                // 高级错误，影响主要功能
  CRITICAL = 'critical'         // 严重错误，无法继续使用
}

enum ErrorCategory {
  NETWORK = 'network',          // 网络相关
  AI_SERVICE = 'ai_service',    // AI服务相关
  VALIDATION = 'validation',    // 验证相关
  STORAGE = 'storage',          // 存储相关
  CONFIG = 'config',            // 配置相关
  GAME_LOGIC = 'game_logic',    // 游戏逻辑相关
  UI = 'ui',                    // 界面相关
  SYSTEM = 'system'             // 系统相关
}

enum RecoveryStrategy {
  RETRY = 'retry',              // 重试操作
  FALLBACK = 'fallback',        // 使用备用方案
  RESET = 'reset',              // 重置状态
  IGNORE = 'ignore',            // 忽略错误
  USER_ACTION = 'user_action'   // 需要用户操作
}
```

### 5.3 异常处理机制

#### 5.3.1 全局错误处理器

```typescript
interface GlobalErrorHandler {
  
  /**
   * 注册错误处理器
   * @param category 错误分类
   * @param handler 处理器函数
   */
  registerHandler(category: ErrorCategory, handler: ErrorHandler): void;
  
  /**
   * 处理错误
   * @param error 错误对象
   * @returns 处理结果
   */
  handleError(error: Error | ProcessedError): ErrorHandleResult;
  
  /**
   * 设置错误过滤器
   * @param filter 过滤器函数
   */
  setErrorFilter(filter: ErrorFilter): void;
  
  /**
   * 获取错误统计
   */
  getErrorStats(): ErrorStatistics;
  
  /**
   * 清除错误记录
   */
  clearErrorHistory(): void;
}

interface ErrorHandleResult {
  handled: boolean;             // 是否已处理
  recovery: RecoveryAction;     // 恢复动作
  userNotification?: UserNotification; // 用户通知
  logLevel: LogLevel;           // 日志级别
}

interface RecoveryAction {
  type: RecoveryStrategy;       // 恢复策略
  params?: any;                 // 恢复参数
  delay?: number;               // 延迟时间
  maxAttempts?: number;         // 最大尝试次数
}
```

#### 5.3.2 错误恢复机制

```typescript
interface ErrorRecoveryManager {
  
  /**
   * 执行错误恢复
   * @param error 错误信息
   * @param strategy 恢复策略
   */
  executeRecovery(error: ProcessedError, strategy: RecoveryStrategy): Promise<RecoveryResult>;
  
  /**
   * 注册恢复处理器
   * @param strategy 恢复策略
   * @param handler 处理器函数
   */
  registerRecoveryHandler(strategy: RecoveryStrategy, handler: RecoveryHandler): void;
  
  /**
   * 创建系统检查点
   */
  createCheckpoint(): Promise<string>;
  
  /**
   * 回滚到检查点
   * @param checkpointId 检查点ID
   */
  rollbackToCheckpoint(checkpointId: string): Promise<boolean>;
  
  /**
   * 获取恢复历史
   */
  getRecoveryHistory(): RecoveryRecord[];
}

interface RecoveryResult {
  success: boolean;             // 恢复是否成功
  message: string;              // 恢复消息
  newState?: any;               // 新状态
  nextAction?: string;          // 下一步操作建议
}
```

### 5.4 错误消息国际化

```typescript
interface ErrorMessages {
  [ErrorCode.NETWORK_ERROR]: {
    en: "Network connection failed. Please check your internet connection.",
    zh: "网络连接失败，请检查您的网络连接。"
  };
  [ErrorCode.INVALID_API_KEY]: {
    en: "Invalid API key. Please check your AI service configuration.",
    zh: "API密钥无效，请检查您的AI服务配置。"
  };
  [ErrorCode.STORAGE_FULL]: {
    en: "Storage space is full. Please clear some data or export your saves.",
    zh: "存储空间已满，请清理一些数据或导出您的存档。"
  };
  // ... 更多错误消息
}

// 错误消息获取函数
function getErrorMessage(code: ErrorCode, language: string = 'zh'): string {
  const messages = ErrorMessages[code];
  return messages?.[language] || messages?.['en'] || 'Unknown error';
}
```

---

## 6. 性能和限制说明

### 6.1 AI服务集成说明

本系统采用用户直连AI服务的模式，目前开发阶段支持三个主要AI服务商：

#### 6.1.1 DeepSeek API
- **定价优势**: 目前提供较为优惠的定价策略
- **模型特色**: 支持推理模型（deepseek-reasoner）提供思考过程
- **缓存机制**: 支持prompt缓存，命中缓存时费用大幅降低（0.1元/百万tokens vs 1元/百万tokens）
- **兼容性**: 提供OpenAI和Anthropic API格式兼容
- **限制**: token使用量计算需要使用官方tokenizer

#### 6.1.2 Google Gemini API  
- **模型版本**: 支持最新的gemini-2.5-flash模型
- **多模态**: 原生支持文本、图像等多模态输入
- **实时功能**: 支持Live API进行实时交互
- **Token监控**: 提供详细的token使用量统计和按模态分类
- **认证方式**: 支持API Key和OAuth 2.0两种认证方式

#### 6.1.3 SiliconFlow API
- **模型丰富**: 提供多种开源和商业模型选择
- **服务完整**: 支持聊天、嵌入、重排序、图像生成等多种AI服务
- **批处理**: 支持批量处理功能降低成本
- **账户管理**: 提供余额查询和使用统计功能
- **语音功能**: 支持语音合成和转录服务

### 6.1.4 通用特性
- 用户使用自己的API密钥，费用和使用限制由用户的服务套餐决定
- 系统会自动适配不同AI服务商的API格式和特点
- 支持动态调整请求参数以优化不同模型的表现
- 错误处理会根据不同服务商的错误码进行相应处理
- 支持流式和非流式响应处理

### 6.2 数据大小限制和服务商对比

```typescript
interface SystemLimits {
  // 技术限制（受浏览器和网络限制）
  maxRequestSize: number;       // 最大请求大小(字节)
  maxResponseSize: number;      // 最大响应大小(字节)
  
  // 存储限制（受浏览器限制）
  maxLocalStorageSize: number;  // 最大本地存储(MB)
  maxSaveFileSize: number;      // 最大存档文件(MB)
  maxConfigSize: number;        // 最大配置文件(KB)
  
  // 用户体验优化限制（可调整）
  maxHistoryRounds: number;     // 最大历史回合数
  maxExtensionCards: number;    // 最大扩展卡片数
  maxStatusFields: number;      // 最大状态字段数
  
  // AI服务商特定限制
  aiServiceLimits: {
    [service: string]: ServiceLimits;
  };
  
  // 注意：不包含prompt长度和世界观内容长度限制
}

interface ServiceLimits {
  maxTokens: number;            // 最大token数
  maxContextLength: number;     // 最大上下文长度
  rateLimits: {
    requestsPerMinute: number;  // 每分钟请求数
    tokensPerMinute: number;    // 每分钟token数
  };
  specialFeatures?: {
    [key: string]: any;         // 特殊功能配置
  };
}

// 三个主要AI服务商对比表
const AI_SERVICE_COMPARISON = {
  deepseek: {
    pros: ['性价比高', '推理能力强', 'KV缓存优化', '多种兼容格式'],
    cons: ['相对较新', '生态较小'],
    bestFor: ['成本敏感项目', '需要推理能力', '长对话场景'],
    pricing: '相对最低',
    stability: '良好'
  },
  
  gemini: {
    pros: ['多模态支持', 'Google生态', 'Live API', '强大的安全控制'],
    cons: ['定价相对较高', '某些地区限制'],
    bestFor: ['多模态应用', '实时交互', '企业级应用'],
    pricing: '中等',
    stability: '优秀'
  },
  
  siliconflow: {
    pros: ['模型选择多', '服务种类全', '批处理支持', '语音功能'],
    cons: ['文档相对较少', '国内访问优化'],
    bestFor: ['多样化需求', '批量处理', '语音应用'],
    pricing: '灵活',
    stability: '良好'
  }
};

// 系统配置参数 - 针对三个主要AI服务商优化
const SYSTEM_CONFIG: SystemLimits = {
  // 请求处理限制
  maxRequestSize: 2048 * 1024,  // 2MB（支持更大的多模态输入）
  maxResponseSize: 1024 * 1024, // 1MB（支持更长的AI响应）
  
  // 本地存储限制（受浏览器限制）
  maxLocalStorageSize: 100,     // 100MB（增加以支持更多数据）
  maxSaveFileSize: 20,          // 20MB（支持更大的存档）
  maxConfigSize: 200,           // 200KB（支持更复杂的配置）
  
  // 用户体验优化
  maxHistoryRounds: 200,        // 200回合（增加历史记录）
  maxExtensionCards: 15,        // 15个扩展卡片
  maxStatusFields: 30,          // 30个状态字段
  
  // AI服务商特定限制
  aiServiceLimits: {
    deepseek: {
      maxTokens: 8192,          // DeepSeek最大token限制
      maxCacheSize: '10MB',     // KV缓存大小
      reasoningMaxTokens: 32768, // 推理模式最大token
    },
    
    gemini: {
      maxTokens: 32768,         // Gemini 2.5 Flash最大token
      maxFileSize: '20MB',      // 多模态文件大小限制
      contextCacheSize: '1M',   // 上下文缓存大小
    },
    
    siliconflow: {
      maxTokens: 4096,          // 默认最大token（模型依赖）
      batchSize: 100,           // 批处理大小
      maxVoiceFileSize: '25MB', // 语音文件大小限制
    }
  },
  
  // 注意：不限制prompt长度和世界观内容长度，以保证游戏体验
};
```

### 6.3 性能监控接口

```typescript
interface PerformanceMonitor {
  
  /**
   * 记录API调用性能
   * @param serviceType AI服务类型
   * @param duration 调用耗时(毫秒)
   * @param success 是否成功
   */
  recordAPICall(serviceType: AIServiceType, duration: number, success: boolean): void;
  
  /**
   * 记录渲染性能
   * @param component 组件名称
   * @param renderTime 渲染时间(毫秒)
   */
  recordRenderTime(component: string, renderTime: number): void;
  
  /**
   * 记录内存使用
   */
  recordMemoryUsage(): void;
  
  /**
   * 获取性能报告
   */
  getPerformanceReport(): PerformanceReport;
  
  /**
   * 清除性能数据
   */
  clearPerformanceData(): void;
}

interface PerformanceReport {
  // API性能
  apiPerformance: {
    [serviceType: string]: {
      averageResponseTime: number;  // 平均响应时间
      successRate: number;          // 成功率
      totalCalls: number;           // 总调用次数
      errorCount: number;           // 错误次数
    };
  };
  
  // 渲染性能
  renderPerformance: {
    [component: string]: {
      averageRenderTime: number;    // 平均渲染时间
      maxRenderTime: number;        // 最大渲染时间
      totalRenders: number;         // 总渲染次数
    };
  };
  
  // 内存使用
  memoryUsage: {
    current: number;                // 当前内存使用(MB)
    peak: number;                   // 峰值内存使用(MB)
    average: number;                // 平均内存使用(MB)
  };
  
  // 存储使用
  storageUsage: {
    total: number;                  // 总存储使用(MB)
    available: number;              // 可用存储(MB)
    itemCount: number;              // 项目数量
  };
}
```

### 6.4 缓存策略

```typescript
interface CacheManager {
  
  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 生存时间(秒)
   */
  set(key: string, value: any, ttl?: number): void;
  
  /**
   * 获取缓存
   * @param key 缓存键
   */
  get<T>(key: string): T | null;
  
  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): boolean;
  
  /**
   * 清空缓存
   */
  clear(): void;
  
  /**
   * 获取缓存统计
   */
  getStats(): CacheStats;
}

// 缓存策略配置
interface CacheConfig {
  // AI响应缓存
  aiResponseCache: {
    enabled: boolean;             // 是否启用
    maxSize: number;              // 最大缓存大小(MB)
    ttl: number;                  // 默认TTL(秒)
    keyStrategy: 'prompt_hash' | 'full_context'; // 缓存键策略
    
    // DeepSeek KV缓存特性
    deepseekKVCache?: {
      enabled: boolean;           // 启用DeepSeek KV缓存
      trackHitRate: boolean;      // 跟踪缓存命中率
      maxContextLength: number;   // 最大上下文长度
    };
  };
  
  // 配置缓存
  configCache: {
    enabled: boolean;
    maxItems: number;             // 最大缓存项数
    ttl: number;
  };
  
  // 渲染缓存
  renderCache: {
    enabled: boolean;
    maxComponents: number;        // 最大缓存组件数
    invalidateOnStateChange: boolean; // 状态变化时是否失效
  };
  
  // 模型特定缓存
  modelCache: {
    geminiCache?: {
      contextCaching: boolean;    // Gemini上下文缓存
      cacheSize: number;         // 缓存大小
    };
    
    siliconFlowCache?: {
      batchCache: boolean;       // 批处理缓存
      resultCache: boolean;      // 结果缓存
    };
  };
}
```

---

## 7. 开发和测试指南

### 7.1 接口调用示例

#### 7.1.1 游戏引擎使用示例

```typescript
// 初始化游戏引擎
const gameEngine = new GameEngine();

// 配置游戏
const config: GameConfiguration = {
  id: 'demo-game',
  name: '演示游戏',
  world: {
    id: 'fantasy-world',
    name: '奇幻世界',
    background: '这是一个充满魔法的世界...',
    // ... 其他世界观配置
  },
  status: {
    id: 'basic-status',
    name: '基础状态',
    fields: [
      {
        id: 'health',
        name: 'health',
        displayName: '生命值',
        type: FieldType.PROGRESS,
        config: {
          min: 0,
          max: 100,
          initial: 100,
          color: '#ff0000'
        }
      }
    ]
  },
  // ... 其他配置
};

// 开始新游戏
await gameEngine.startNewGame(config);

// 处理用户输入
const userInput: UserInput = {
  id: 'input-001',
  type: UserInputType.TEXT_INPUT,
  content: '我想探索北边的森林',
  timestamp: Date.now()
};

const result = await gameEngine.processUserInput(userInput);
console.log('处理结果:', result);
```

#### 7.1.2 AI服务使用示例

```typescript
// 创建AI适配器
const aiAdapter = new OpenAIAdapter();

// 配置AI服务
const aiConfig: OpenAIConfig = {
  apiKey: 'sk-your-api-key',
  model: 'gpt-4',
  baseURL: 'https://api.openai.com/v1'
};

// 初始化连接
await aiAdapter.initialize(aiConfig);

// 构建请求
const request: AIRequest = {
  id: 'req-001',
  prompt: 'AI prompt content...',
  config: {
    temperature: 0.7,
    maxTokens: 1000,
    timeout: 30000,
    retryAttempts: 3,
    stream: false
  },
  metadata: {
    gameRound: 1,
    worldId: 'fantasy-world',
    statusConfig: statusConfig,
    extensions: []
  },
  timestamp: Date.now()
};

// 发送请求
const response = await aiAdapter.sendRequest(request);

if (response.success && response.data) {
  console.log('场景:', response.data.scene);
  console.log('旁白:', response.data.narration);
  console.log('选项:', response.data.options);
} else {
  console.error('AI请求失败:', response.error);
}
```

#### 7.1.3 配置管理使用示例

```typescript
// 创建配置管理器
const configManager = new ConfigManager();

// 保存世界观配置
const worldConfig: WorldConfig = {
  id: 'my-world',
  name: '我的世界',
  description: '自定义的游戏世界',
  background: '世界背景描述...',
  rules: '游戏规则...',
  characters: '角色设定...',
  setting: '环境设定...',
  tags: ['奇幻', '冒险'],
  difficulty: 3,
  estimatedDuration: 120,
  version: '1.0.0',
  createdAt: Date.now(),
  updatedAt: Date.now()
};

const worldId = await configManager.saveConfig(ConfigType.WORLD, worldConfig);
console.log('世界观配置已保存，ID:', worldId);

// 加载配置
const loadedWorld = await configManager.loadConfig<WorldConfig>(ConfigType.WORLD, worldId);
console.log('加载的世界观:', loadedWorld);

// 验证配置
const validation = configManager.validateConfig(ConfigType.WORLD, worldConfig);
if (!validation.isValid) {
  console.error('配置验证失败:', validation.errors);
}
```

#### 7.1.4 事件系统使用示例

```typescript
// 创建事件总线
const eventBus = new EventBus();

// 订阅游戏事件
eventBus.on(GameEvent.STATE_CHANGED, (data: StateChangeData) => {
  console.log('游戏状态变化:', data);
  // 更新UI
});

eventBus.on(GameEvent.AI_RESPONSE_RECEIVED, (response: AIResponse) => {
  console.log('收到AI响应:', response);
  // 处理响应
});

// 发布事件
eventBus.emit(GameEvent.GAME_STARTED, {
  gameId: 'game-001',
  timestamp: Date.now()
});

// 一次性订阅
eventBus.once(GameEvent.GAME_ENDED, (data) => {
  console.log('游戏结束:', data);
  // 清理资源
});
```

### 7.2 单元测试规范

#### 7.2.1 测试文件结构

```
tests/
├── unit/                     # 单元测试
│   ├── core/                # 核心模块测试
│   │   ├── GameEngine.test.ts
│   │   ├── StateManager.test.ts
│   │   └── EventBus.test.ts
│   ├── ai/                  # AI服务测试
│   │   ├── OpenAIAdapter.test.ts
│   │   ├── ClaudeAdapter.test.ts
│   │   └── ResponseParser.test.ts
│   ├── config/              # 配置管理测试
│   │   ├── ConfigManager.test.ts
│   │   ├── WorldEditor.test.ts
│   │   └── StatusEditor.test.ts
│   ├── storage/             # 存储模块测试
│   │   ├── StorageManager.test.ts
│   │   ├── ImportExport.test.ts
│   │   └── CacheManager.test.ts
│   └── ui/                  # UI模块测试
│       ├── SceneRenderer.test.tsx
│       ├── OptionsRenderer.test.tsx
│       └── StatusBar.test.tsx
├── integration/             # 集成测试
│   ├── GameFlow.test.ts
│   ├── AIIntegration.test.ts
│   └── ConfigFlow.test.ts
├── e2e/                     # 端到端测试
│   ├── GamePlay.test.ts
│   ├── ConfigManagement.test.ts
│   └── DataPersistence.test.ts
└── fixtures/                # 测试数据
    ├── mockConfigs.ts
    ├── mockResponses.ts
    └── testData.ts
```

#### 7.2.2 测试示例

**GameEngine 单元测试：**
```typescript
describe('GameEngine', () => {
  let gameEngine: GameEngine;
  let mockAIService: jest.Mocked<AIServiceAdapter>;
  let mockConfigManager: jest.Mocked<ConfigManagerAPI>;
  
  beforeEach(() => {
    mockAIService = createMockAIService();
    mockConfigManager = createMockConfigManager();
    gameEngine = new GameEngine(mockAIService, mockConfigManager);
  });
  
  describe('processUserInput', () => {
    it('应该正确处理文本输入', async () => {
      // 准备测试数据
      const userInput: UserInput = {
        id: 'test-input',
        type: UserInputType.TEXT_INPUT,
        content: '向北走',
        timestamp: Date.now()
      };
      
      const mockAIResponse: AIResponse = {
        id: 'test-response',
        success: true,
        data: {
          scene: '你走向北方...',
          narration: '脚步声回响在空旷的道路上',
          options: [
            { id: 'A', text: '继续前进', enabled: true },
            { id: 'B', text: '停下休息', enabled: true },
            { id: 'C', text: '返回', enabled: true }
          ],
          status: { health: { value: 95, max: 100 } },
          custom: {}
        },
        metadata: createMockMetadata(),
        timestamp: Date.now()
      };
      
      mockAIService.sendRequest.mockResolvedValue(mockAIResponse);
      
      // 执行测试
      const result = await gameEngine.processUserInput(userInput);
      
      // 验证结果
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.scene).toBe('你走向北方...');
      expect(mockAIService.sendRequest).toHaveBeenCalledTimes(1);
    });
    
    it('应该正确处理AI服务错误', async () => {
      const userInput: UserInput = {
        id: 'test-input',
        type: UserInputType.TEXT_INPUT,
        content: '测试输入',
        timestamp: Date.now()
      };
      
      mockAIService.sendRequest.mockResolvedValue({
        id: 'error-response',
        success: false,
        error: {
          code: ErrorCode.NETWORK_ERROR,
          message: 'Network connection failed',
          severity: ErrorSeverity.HIGH,
          category: ErrorCategory.NETWORK,
          recovery: RecoveryStrategy.RETRY,
          userMessage: '网络连接失败',
          timestamp: Date.now()
        },
        metadata: createMockMetadata(),
        timestamp: Date.now()
      });
      
      const result = await gameEngine.processUserInput(userInput);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ErrorCode.NETWORK_ERROR);
    });
  });
  
  describe('updateGameState', () => {
    it('应该正确更新游戏状态', () => {
      const updates: StateUpdate[] = [
        {
          path: 'playerStatus.health',
          value: { value: 80, max: 100 },
          operation: 'set'
        }
      ];
      
      gameEngine.updateGameState(updates);
      
      const currentState = gameEngine.getCurrentState();
      expect(currentState.playerStatus.health).toEqual({ value: 80, max: 100 });
    });
  });
});
```

**AIAdapter 测试：**
```typescript
describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;
  let fetchMock: jest.MockedFunction<typeof fetch>;
  
  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    adapter = new OpenAIAdapter();
  });
  
  describe('sendRequest', () => {
    it('应该成功发送请求并解析响应', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              scene: "测试场景",
              narration: "测试旁白",
              options: [
                { id: "A", text: "选项A" },
                { id: "B", text: "选项B" },
                { id: "C", text: "选项C" }
              ],
              status: { health: { value: 100, max: 100 } },
              custom: {}
            })
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300
        },
        model: 'gpt-4'
      };
      
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response);
      
      const request: AIRequest = createMockRequest();
      const response = await adapter.sendRequest(request);
      
      expect(response.success).toBe(true);
      expect(response.data?.scene).toBe("测试场景");
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('openai.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer')
          })
        })
      );
    });
  });
});
```

### 7.3 Mock数据和测试工具

#### 7.3.1 Mock数据工厂

```typescript
// 测试数据工厂
export class TestDataFactory {
  
  /**
   * 创建模拟用户输入
   */
  static createUserInput(overrides?: Partial<UserInput>): UserInput {
    return {
      id: 'test-input-' + Date.now(),
      type: UserInputType.TEXT_INPUT,
      content: '测试输入内容',
      timestamp: Date.now(),
      ...overrides
    };
  }
  
  /**
   * 创建模拟AI响应
   */
  static createAIResponse(overrides?: Partial<AIResponse>): AIResponse {
    return {
      id: 'test-response-' + Date.now(),
      success: true,
      data: {
        scene: '默认场景描述',
        narration: '默认旁白内容',
        options: [
          { id: 'A', text: '选项A', enabled: true },
          { id: 'B', text: '选项B', enabled: true },
          { id: 'C', text: '选项C', enabled: true }
        ],
        status: { health: { value: 100, max: 100 } },
        custom: {}
      },
      metadata: {
        processingTime: 1500,
        tokenUsage: {
          promptTokens: 100,
          completionTokens: 150,
          totalTokens: 250
        },
        modelUsed: 'gpt-4',
        apiVersion: 'v1'
      },
      timestamp: Date.now(),
      ...overrides
    };
  }
  
  /**
   * 创建模拟游戏配置
   */
  static createGameConfig(overrides?: Partial<GameConfiguration>): GameConfiguration {
    return {
      id: 'test-config-' + Date.now(),
      name: '测试配置',
      description: '用于测试的游戏配置',
      world: this.createWorldConfig(),
      status: this.createStatusConfig(),
      ai: this.createAIConfig(),
      extensions: [],
      theme: this.createThemeConfig(),
      layout: this.createLayoutConfig(),
      settings: this.createGameSettings(),
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['测试'],
      ...overrides
    };
  }
  
  /**
   * 创建模拟世界观配置
   */
  static createWorldConfig(overrides?: Partial<WorldConfig>): WorldConfig {
    return {
      id: 'test-world-' + Date.now(),
      name: '测试世界',
      description: '用于测试的游戏世界',
      background: '这是一个用于测试的虚拟世界...',
      rules: '测试游戏规则...',
      characters: '测试角色设定...',
      setting: '测试环境设定...',
      tags: ['测试', '虚拟'],
      difficulty: 3,
      estimatedDuration: 60,
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      author: 'Test System',
      ...overrides
    };
  }
}
```

#### 7.3.2 测试工具类

```typescript
// 测试辅助工具
export class TestUtils {
  
  /**
   * 等待指定时间
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 等待条件满足
   */
  static async waitFor(
    condition: () => boolean,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const start = Date.now();
    
    while (!condition()) {
      if (Date.now() - start > timeout) {
        throw new Error(`Condition not met within ${timeout}ms`);
      }
      await this.wait(interval);
    }
  }
  
  /**
   * 创建模拟存储
   */
  static createMockStorage(): Storage {
    const storage: Record<string, string> = {};
    
    return {
      getItem: jest.fn((key: string) => storage[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete storage[key];
      }),
      clear: jest.fn(() => {
        Object.keys(storage).forEach(key => delete storage[key]);
      }),
      key: jest.fn((index: number) => Object.keys(storage)[index] || null),
      get length() { return Object.keys(storage).length; }
    };
  }
  
  /**
   * 创建模拟fetch
   */
  static createMockFetch(): jest.MockedFunction<typeof fetch> {
    return jest.fn().mockImplementation((url: string, options?: RequestInit) => {
      // 根据URL返回不同的模拟响应
      if (url.includes('openai.com')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(TestDataFactory.createOpenAIResponse())
        } as Response);
      }
      
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);
    });
  }
  
  /**
   * 验证API调用参数
   */
  static verifyAPICall(
    fetchMock: jest.MockedFunction<typeof fetch>,
    expectedUrl: string,
    expectedMethod: string = 'POST'
  ): void {
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(expectedUrl),
      expect.objectContaining({
        method: expectedMethod,
        headers: expect.any(Object),
        body: expect.any(String)
      })
    );
  }
}
```

### 7.4 调试和排错指南

#### 7.4.1 调试工具

```typescript
// 调试工具类
export class DebugUtils {
  
  private static debugEnabled = process.env.NODE_ENV === 'development';
  
  /**
   * 调试日志
   */
  static log(category: string, message: string, data?: any): void {
    if (!this.debugEnabled) return;
    
    console.group(`🐛 [${category}] ${message}`);
    if (data) {
      console.log('Data:', data);
    }
    console.trace();
    console.groupEnd();
  }
  
  /**
   * 性能监控
   */
  static time(label: string): void {
    if (!this.debugEnabled) return;
    console.time(label);
  }
  
  static timeEnd(label: string): void {
    if (!this.debugEnabled) return;
    console.timeEnd(label);
  }
  
  /**
   * 内存使用监控
   */
  static logMemoryUsage(): void {
    if (!this.debugEnabled) return;
    
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.table({
        'Used JS Heap': this.formatBytes(memory.usedJSHeapSize),
        'Total JS Heap': this.formatBytes(memory.totalJSHeapSize),
        'JS Heap Limit': this.formatBytes(memory.jsHeapSizeLimit)
      });
    }
  }
  
  /**
   * 格式化字节数
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * 导出调试数据
   */
  static exportDebugData(): DebugExport {
    return {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage },
      performance: this.getPerformanceData(),
      errors: this.getErrorHistory()
    };
  }
}
```

#### 7.4.2 常见问题排查

| 问题类型 | 症状 | 排查步骤 | 解决方案 |
|----------|------|----------|----------|
| **AI请求失败** | 显示网络错误 | 1. 检查API密钥<br>2. 验证网络连接<br>3. 查看浏览器控制台 | 更新API配置或检查网络 |
| **响应解析错误** | 显示格式错误 | 1. 查看AI原始响应<br>2. 检查JSON格式<br>3. 验证字段映射 | 调整prompt或修复解析逻辑 |
| **配置加载失败** | 界面显示异常 | 1. 检查配置文件格式<br>2. 验证必需字段<br>3. 查看控制台错误 | 重新创建或修复配置 |
| **存储空间不足** | 保存失败提示 | 1. 检查存储使用量<br>2. 清理旧数据<br>3. 导出重要存档 | 清理存储或升级浏览器 |
| **性能问题** | 界面卡顿 | 1. 查看内存使用<br>2. 检查历史数据量<br>3. 监控API响应时间 | 优化配置或清理数据 |

#### 7.4.3 错误报告模板

```typescript
interface ErrorReport {
  // 基本信息
  timestamp: number;
  errorId: string;
  userAgent: string;
  url: string;
  
  // 错误详情
  error: {
    code: ErrorCode;
    message: string;
    stack?: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
  };
  
  // 上下文信息
  context: {
    gameState?: Partial<GameState>;
    currentConfig?: string;
    userAction?: string;
    aiService?: string;
  };
  
  // 系统信息
  system: {
    memoryUsage?: any;
    storageUsage?: StorageStats;
    performanceData?: PerformanceReport;
  };
  
  // 用户反馈
  userFeedback?: {
    description: string;
    stepsToReproduce: string[];
    expectedBehavior: string;
    actualBehavior: string;
  };
}

// 错误报告生成器
export function generateErrorReport(error: Error, context?: any): ErrorReport {
  return {
    timestamp: Date.now(),
    errorId: generateErrorId(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    
    error: {
      code: classifyError(error),
      message: error.message,
      stack: error.stack,
      category: getErrorCategory(error),
      severity: getErrorSeverity(error)
    },
    
    context: {
      gameState: getCurrentGameState(),
      currentConfig: getCurrentConfigId(),
      userAction: getLastUserAction(),
      aiService: getCurrentAIService()
    },
    
    system: {
      memoryUsage: getMemoryUsage(),
      storageUsage: getStorageStats(),
      performanceData: getPerformanceReport()
    }
  };
}
```

---

## 文档版本信息

**文档版本**: v2.0  
**创建时间**: 2025-09-25  
**更新时间**: 2025-09-25  
**维护人员**: 系统架构师  
**适用版本**: AI文字游戏渲染器 v1.0+

---

## 附录

### A. TypeScript类型定义文件
详细的类型定义请参考项目中的 `types/` 目录。

### B. 错误码完整列表
完整的错误码定义请参考 `constants/ErrorCodes.ts` 文件。

### C. 配置模板示例
预置的配置模板请参考 `templates/` 目录。

### D. 测试数据集
标准测试数据请参考 `tests/fixtures/` 目录。