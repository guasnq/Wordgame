import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Wifi, WifiOff, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

const connectionStatusVariants = cva(
  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
  {
    variants: {
      status: {
        connected: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300',
        connecting: 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300',
        disconnected: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300',
        error: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300',
        testing: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300',
      },
      size: {
        sm: 'px-2 py-1 text-xs',
        default: 'px-3 py-1.5 text-xs',
        lg: 'px-4 py-2 text-sm',
      },
    },
    defaultVariants: {
      status: 'disconnected',
      size: 'default',
    },
  },
)

interface ConnectionInfo {
  provider: 'deepseek' | 'gemini' | 'siliconflow' | 'generic'
  model?: string
  responseTime?: number
  lastSuccess?: Date
  errorMessage?: string
  tokenUsage?: {
    total: number
    limit?: number
  }
}

interface ConnectionStatusProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof connectionStatusVariants> {
  connectionInfo?: ConnectionInfo
  onTest?: () => void
  onReconnect?: () => void
  showDetails?: boolean
  animated?: boolean
}

const statusConfig = {
  connected: {
    icon: CheckCircle,
    label: '已连接',
    pulse: false,
  },
  connecting: {
    icon: Clock,
    label: '连接中',
    pulse: true,
  },
  disconnected: {
    icon: WifiOff,
    label: '未连接',
    pulse: false,
  },
  error: {
    icon: AlertCircle,
    label: '连接错误',
    pulse: false,
  },
  testing: {
    icon: Zap,
    label: '测试中',
    pulse: true,
  },
}

const providerNames = {
  deepseek: 'DeepSeek',
  gemini: 'Gemini',
  siliconflow: 'SiliconFlow',
  generic: 'AI服务',
}

const ConnectionStatus = React.forwardRef<HTMLDivElement, ConnectionStatusProps>(
  ({
    className,
    status = 'disconnected',
    size,
    connectionInfo,
    onTest,
    onReconnect,
    showDetails = true,
    animated = true,
    ...props
  }, ref) => {
    const config = statusConfig[status!]
    const IconComponent = config.icon
    const providerName = connectionInfo?.provider ? providerNames[connectionInfo.provider] : 'AI服务'
    
    const formatResponseTime = (time?: number) => {
      if (!time) return null
      return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(1)}s`
    }
    
    const formatTokenUsage = (usage?: ConnectionInfo['tokenUsage']) => {
      if (!usage) return null
      const percentage = usage.limit ? (usage.total / usage.limit * 100).toFixed(1) : null
      return `${usage.total.toLocaleString()}${percentage ? ` (${percentage}%)` : ''}`
    }
    
    const statusElement = (
      <div
        ref={ref}
        className={cn(connectionStatusVariants({ status, size, className }))}
        {...props}
      >
        <IconComponent 
          className={cn(
            'size-3',
            animated && config.pulse && 'animate-pulse'
          )} 
        />
        <span>
          {providerName}: {config.label}
        </span>
      </div>
    )
    
    if (!showDetails) {
      return statusElement
    }
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="cursor-pointer hover:opacity-80 transition-opacity">
            {statusElement}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">连接详情</h4>
              <div className={cn(
                'flex items-center gap-1 text-xs rounded-full px-2 py-1',
                {
                  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300': status === 'connected',
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300': status === 'connecting' || status === 'testing',
                  'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300': status === 'disconnected' || status === 'error',
                }
              )}>
                <IconComponent className="size-3" />
                {config.label}
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">服务商:</span>
                <span className="font-medium">{providerName}</span>
              </div>
              
              {connectionInfo?.model && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">模型:</span>
                  <span className="font-mono text-xs">{connectionInfo.model}</span>
                </div>
              )}
              
              {connectionInfo?.responseTime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">响应时间:</span>
                  <span className="font-mono">{formatResponseTime(connectionInfo.responseTime)}</span>
                </div>
              )}
              
              {connectionInfo?.lastSuccess && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最后成功:</span>
                  <span className="text-xs">{connectionInfo.lastSuccess.toLocaleTimeString()}</span>
                </div>
              )}
              
              {connectionInfo?.tokenUsage && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token用量:</span>
                  <span className="font-mono text-xs">{formatTokenUsage(connectionInfo.tokenUsage)}</span>
                </div>
              )}
              
              {connectionInfo?.errorMessage && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground text-xs mb-1">错误信息:</p>
                  <p className="text-red-600 dark:text-red-400 text-xs font-mono bg-red-50 dark:bg-red-950 p-2 rounded">
                    {connectionInfo.errorMessage}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-2 border-t">
              {onTest && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onTest}
                  disabled={status === 'testing' || status === 'connecting'}
                  className="flex-1"
                >
                  <Zap className="size-3 mr-1" />
                  测试连接
                </Button>
              )}
              
              {onReconnect && status !== 'connected' && (
                <Button
                  size="sm"
                  onClick={onReconnect}
                  disabled={status === 'connecting'}
                  className="flex-1"
                >
                  <Wifi className="size-3 mr-1" />
                  重新连接
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  },
)
ConnectionStatus.displayName = 'ConnectionStatus'

// 简化版本，用于头部或状态栏
const SimpleConnectionStatus: React.FC<{
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  provider?: string
  className?: string
}> = ({ status, provider = 'AI', className }) => {
  const config = statusConfig[status]
  const IconComponent = config.icon
  
  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      <IconComponent 
        className={cn(
          'size-3',
          {
            'text-green-600 dark:text-green-400': status === 'connected',
            'text-yellow-600 dark:text-yellow-400 animate-pulse': status === 'connecting',
            'text-red-600 dark:text-red-400': status === 'disconnected' || status === 'error',
          }
        )} 
      />
      <span className="text-muted-foreground">
        {provider}: {config.label}
      </span>
    </div>
  )
}

export { 
  ConnectionStatus, 
  SimpleConnectionStatus,
  connectionStatusVariants 
}
export type { ConnectionStatusProps, ConnectionInfo }