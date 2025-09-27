import type { ReactNode } from "react"

interface GameLayoutProps {
  children: ReactNode
}

export function GameLayout({ children }: GameLayoutProps) {
  return <div className="min-h-screen bg-background text-foreground flex flex-col">{children}</div>
}
