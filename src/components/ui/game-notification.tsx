import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, Award, Package, Coins, Heart, AlertTriangle, Info, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

const gameNotificationVariants = cva(
  "relative flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-top-2",
  {
    variants: {
      type: {
        achievement:
          "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
        item:
          "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
        reward:
          "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
        status:
          "bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-200",
        warning:
          "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-200",
        error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
        info: "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200",
        success:
          "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200",
        quest:
          "bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-200",
        relationship:
          "bg-pink-50 border-pink-200 text-pink-800 dark:bg-pink-950 dark:border-pink-800 dark:text-pink-200",
        system:
          "bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200",
      },
      size: {
        sm: "p-3 text-sm",
        default: "p-4",
        lg: "p-5 text-lg",
      },
      position: {
        "top-right": "fixed top-4 right-4 z-50",
        "top-left": "fixed top-4 left-4 z-50",
        "bottom-right": "fixed bottom-4 right-4 z-50",
        "bottom-left": "fixed bottom-4 left-4 z-50",
        "top-center": "fixed top-4 left-1/2 -translate-x-1/2 z-50",
        static: "relative",
      },
    },
    defaultVariants: {
      type: "info",
      size: "default",
      position: "static",
    },
  },
)

interface GameNotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gameNotificationVariants> {
  title: string
  description?: string
  onClose?: () => void
  showIcon?: boolean
  autoHide?: boolean
  hideDelay?: number
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "ghost"
  }>
}

const typeIconMap = {
  achievement: Award,
  item: Package,
  reward: Coins,
  status: Heart,
  warning: AlertTriangle,
  error: AlertTriangle,
  info: Info,
  success: CheckCircle,
  quest: Award,
  relationship: Heart,
  system: Info,
} as const

const GameNotification = React.forwardRef<HTMLDivElement, GameNotificationProps>(
  (
    {
      className,
      type = "info",
      size,
      position,
      title,
      description,
      onClose,
      showIcon = true,
      autoHide = false,
      hideDelay = 5000,
      actions,
      ...props
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = React.useState(true)

    const IconComponent = typeIconMap[type!]

    React.useEffect(() => {
      if (autoHide && hideDelay > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false)
          setTimeout(() => onClose?.(), 300)
        }, hideDelay)

        return () => clearTimeout(timer)
      }
    }, [autoHide, hideDelay, onClose])

    const handleClose = () => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300)
    }

    if (!isVisible) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          gameNotificationVariants({ type, size, position, className }),
          !isVisible && "animate-out slide-out-to-top-2",
        )}
        role="alert"
        aria-live="polite"
        {...props}
      >
        {showIcon && IconComponent && (
          <div className="flex-shrink-0 mt-0.5">
            <IconComponent className="size-5" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm leading-tight">{title}</h4>
          {description && (
            <p className="mt-1 text-sm opacity-90 leading-relaxed">{description}</p>
          )}

          {actions && actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant || "outline"}
                  onClick={action.onClick}
                  className="h-7 px-3 text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="flex-shrink-0 size-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="size-3" />
            <span className="sr-only">关闭</span>
          </Button>
        )}
      </div>
    )
  },
)
GameNotification.displayName = "GameNotification"


type NotificationItem = Omit<GameNotificationProps, "onClose"> & {
  id: string
  timestamp: number
}

const GameNotificationContainer: React.FC<{
  notifications: NotificationItem[]
  onRemove: (id: string) => void
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center"
}> = ({ notifications, onRemove, position = "top-right" }) => {
  if (notifications.length === 0) return null

  return (
    <div
      className={cn(
        "fixed z-50 max-w-sm w-full space-y-2",
        {
          "top-4 right-4": position === "top-right",
          "top-4 left-4": position === "top-left",
          "bottom-4 right-4": position === "bottom-right",
          "bottom-4 left-4": position === "bottom-left",
          "top-4 left-1/2 -translate-x-1/2": position === "top-center",
        },
      )}
    >
      {notifications.map((notification) => (
        <GameNotification
          key={notification.id}
          {...notification}
          position="static"
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  )
}

export { GameNotification, GameNotificationContainer }
export type { GameNotificationProps, NotificationItem }

