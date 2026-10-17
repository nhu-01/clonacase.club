import type { ReactNode } from "react"
import { cn } from "cn"

export function Rise({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <div className={cn("rise", className)} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  )
}
