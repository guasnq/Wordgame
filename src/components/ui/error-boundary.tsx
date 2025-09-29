import * as React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { cn } from '@/lib/utils'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  className?: string
}

interface ErrorFallbackProps {
  error?: Error
  resetError: () => void
  className?: string
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })
    
    this.props.onError?.(error, errorInfo)
    
    // 在开发环境中打印错误信息
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetError={this.resetError}
          className={this.props.className}
        />
      )
    }

    return this.props.children
  }
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError,
  className 
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return (
    <div className={cn('flex items-center justify-center min-h-[400px] p-6', className)}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="size-12 text-destructive" />
          </div>
          <CardTitle className="text-lg">出现错误</CardTitle>
          <CardDescription>
            抱歉，应用程序遇到了意外错误
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && error && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-mono text-muted-foreground break-all">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button onClick={resetError} className="w-full">
              <RefreshCw className="size-4 mr-2" />
              重试
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <Home className="size-4 mr-2" />
              返回首页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// AI请求专用的错误回退组件
const AIErrorFallback: React.FC<ErrorFallbackProps & { 
  onRetry?: () => void
  provider?: string 
}> = ({ 
  error: _error, 
  resetError, 
  onRetry,
  provider = 'AI服务',
  className 
}) => {
  const handleRetry = () => {
    resetError()
    onRetry?.()
  }
  
  return (
    <div className={cn('flex items-center justify-center p-4', className)}>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <AlertTriangle className="size-8 text-destructive mx-auto mb-2" />
          <CardTitle className="text-base">{provider}连接失败</CardTitle>
          <CardDescription className="text-sm">
            请检查网络连接和API配置
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRetry} size="sm" className="w-full">
            <RefreshCw className="size-3 mr-2" />
            重新连接
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export { ErrorBoundary, DefaultErrorFallback, AIErrorFallback }
export type { ErrorBoundaryProps, ErrorFallbackProps }