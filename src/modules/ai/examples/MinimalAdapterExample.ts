import type {
  AIConfig,
  AIResponse,
  ConnectionConfig,
  ConnectionTestResult,
  RequestExecutionInternalResult
} from '@/types/ai'
import { AIProvider } from '@/types/enums'
import { ErrorCode } from '@/types/error'
import type { ErrorMetadata } from '../errors/BaseErrorProcessor'
import { BaseErrorProcessor } from '../errors/BaseErrorProcessor'
import { BaseConnectionManager } from '../connection/BaseConnectionManager'
import { BaseRequestHandler, type RequestExecutionParams } from '../request/BaseRequestHandler'
import { BaseAIServiceAdapter } from '../base/BaseAIServiceAdapter'

/**
 * 示例连接管理器：演示如何快速完成三个抽象方法。
 */
class MinimalConnectionManager extends BaseConnectionManager {
  protected async establishConnection(config: ConnectionConfig): Promise<void> {
    // 示例：这里可以调用「获取余额」之类的接口来验证凭证是否可用
    await Promise.resolve(config.apiKey)
  }

  protected async terminateConnection(): Promise<void> {
    // 示例：释放连接池或关闭 SSE 流
    return Promise.resolve()
  }

  protected async performConnectionTest(config: ConnectionConfig): Promise<ConnectionTestResult> {
    // 示例：发起一次轻量请求验证连通性
    await Promise.resolve(config.apiUrl)
    return {
      success: true,
      responseTime: 42
    }
  }
}

/**
 * 示例请求处理器：将请求参数转换为统一响应。
 */
class MinimalRequestHandler extends BaseRequestHandler {
  protected async performRequest(
    params: RequestExecutionParams
  ): Promise<RequestExecutionInternalResult> {
    const response: AIResponse = {
      id: params.request.id,
      success: true,
      timestamp: Date.now(),
      data: undefined,
      metadata: {
        processingTime: 0,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        modelUsed: params.config.connection.model,
        apiVersion: 'demo'
      }
    }

    return {
      response,
      rawResponse: { message: 'demo response' }
    }
  }
}

/**
 * 示例错误处理器：根据服务商错误返回统一错误码。
 */
class MinimalErrorProcessor extends BaseErrorProcessor {
  protected getProviderErrorCode(error: unknown, _metadata: ErrorMetadata) {
    if (error instanceof Error && error.message.includes('quota')) {
      return ErrorCode.AI_QUOTA_EXCEEDED
    }

    return null
  }
}

/**
 * MinimalAdapter 展示了如何组合基类，适合作为项目模板起点。
 */
export class MinimalAdapter extends BaseAIServiceAdapter {
  constructor() {
    super(AIProvider.DEEPSEEK)
  }

  protected createConnectionManager() {
    return new MinimalConnectionManager({ logger: this.logger })
  }

  protected createRequestHandler() {
    return new MinimalRequestHandler({ logger: this.logger })
  }

  protected createErrorProcessor() {
    return new MinimalErrorProcessor({ provider: this.provider, logger: this.logger })
  }
}

export async function createMinimalAdapter(config: AIConfig) {
  const adapter = new MinimalAdapter()
  await adapter.initialize(config)
  return adapter
}
