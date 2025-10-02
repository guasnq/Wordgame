# AI 服务适配器基础模块

本目录提供实现外部 AI 服务适配器所需的基类与工具。要集成新的服务商，请按如下步骤操作：

1. **继承 `BaseAIServiceAdapter`**：在子类构造函数中指定 `AIProvider`，并实现 `createConnectionManager`、`createRequestHandler`、`createErrorProcessor`。
2. **实现连接管理器**：继承 `BaseConnectionManager`，在 `establishConnection` 中完成握手或 API 健康检查，在 `performConnectionTest` 中返回统一的 `ConnectionTestResult`。
3. **实现请求处理器**：继承 `BaseRequestHandler`，在 `performRequest` 方法里构建请求体并调用外部接口，返回 `AIResponse` 及可选的原始响应与 Token 统计。
4. **实现错误处理器**：继承 `BaseErrorProcessor`，在 `getProviderErrorCode` 中把服务商错误映射到系统自定义的 `ErrorCode`。
5. **（可选）扩展遥测**：`getTelemetry()` 返回 `AdapterTelemetrySnapshot`，可用于界面展示或监控模块。

示例代码请参考 `examples/MinimalAdapterExample.ts`。
