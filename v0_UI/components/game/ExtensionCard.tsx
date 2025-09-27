import type { ReactNode } from "react"

interface ExtensionCardProps {
  title: string
  children: ReactNode
  className?: string
}

export function ExtensionCard({ title, children, className = "" }: ExtensionCardProps) {
  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-3 text-foreground border-b border-border pb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
