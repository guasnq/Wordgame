import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"
import { Brain, Wifi, WifiOff, AlertCircle, CheckCircle } from "lucide-react"

const aiStatusVariants = cva(
  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
  {
    variants: {
      status: {
        thinking: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        processing: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        connected: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
        disconnected: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
        error: "bg-destructive/10 text-destructive dark:bg-destructive/20",
        success: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
        idle: "bg-muted text-muted-foreground",
      },
      size: {
        sm: "text-xs px-2 py-1",
        default: "text-sm px-3 py-1.5",
        lg: "text-base px-4 py-2",
      },
    },
    defaultVariants: {
      status: "idle",
      size: "default",
    },
  },
)

interface AIStatusProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof aiStatusVariants> {
  message?: string
  showIcon?: boolean
  provider?: "deepseek" | "gemini" | "siliconflow" | "generic"
}

const statusConfig = {
  thinking: {
    icon: Brain,
    defaultMessage: "AI正在思考中...",
    showSpinner: true,
  },
  processing: {
    icon: Brain,
    defaultMessage: "正在处理请求...",
    showSpinner: true,
  },
  connected: {
    icon: Wifi,
    defaultMessage: "已连接",
    showSpinner: false,
  },
  disconnected: {
    icon: WifiOff,
    defaultMessage: "未连接",
    showSpinner: false,
  },
  error: {
    icon: AlertCircle,
    defaultMessage: "连接错误",
    showSpinner: false,
  },
  success: {
    icon: CheckCircle,
    defaultMessage: "操作成功",
    showSpinner: false,
  },
  idle: {
    icon: null,
    defaultMessage: "等待输入...",
    showSpinner: false,
  },
} as const

type StatusKey = keyof typeof statusConfig

const AIStatus = React.forwardRef<HTMLDivElement, AIStatusProps>(
  (
    {
      className,
      status = "idle",
      size,
      message,
      showIcon = true,
      provider = "generic",
      ...props
    },
    ref,
  ) => {
    const resolvedStatus: StatusKey = (status ?? "idle") as StatusKey
    const config = statusConfig[resolvedStatus]
    const IconComponent = config.icon
    const displayMessage = message || config.defaultMessage

    const providerPrefix =
      provider !== "generic" ? `${provider.charAt(0).toUpperCase() + provider.slice(1)}: ` : ""

    return (
      <div
        ref={ref}
        data-slot="ai-status"
        className={cn(aiStatusVariants({ status: resolvedStatus, size, className }))}
        role="status"
        aria-live="polite"
        {...props}
      >
        {config.showSpinner && (
          <Spinner size="sm" variant={resolvedStatus === "thinking" ? "default" : "secondary"} />
        )}
        {showIcon && IconComponent && !config.showSpinner && (
          <IconComponent className="size-4" />
        )}
        <span>
          {providerPrefix}
          {displayMessage}
        </span>
      </div>
    )
  },
)
AIStatus.displayName = "AIStatus"

export { AIStatus }
