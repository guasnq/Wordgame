import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const spinnerVariants = cva(
  'animate-spin inline-block border-solid border-current border-r-transparent rounded-full',
  {
    variants: {
      size: {
        sm: 'size-4 border-2',
        default: 'size-6 border-2',
        lg: 'size-8 border-3',
        xl: 'size-12 border-4',
      },
      variant: {
        default: 'text-primary',
        secondary: 'text-secondary-foreground',
        muted: 'text-muted-foreground',
        destructive: 'text-destructive',
        accent: 'text-accent-foreground',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  },
)

interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  asChild?: boolean
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="spinner"
        className={cn(spinnerVariants({ variant, size, className }))}
        role="status"
        aria-label="Loading"
        {...props}
      />
    )
  },
)
Spinner.displayName = 'Spinner'

export { Spinner, spinnerVariants }