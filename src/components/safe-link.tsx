import Link from "next/link"
import { isHttpUrl, isInternalPath } from "@/lib/format"

export function SafeLink({
  href,
  children,
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  if (!href) return <span className={className}>{children}</span>
  if (isInternalPath(href)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }
  if (!isHttpUrl(href)) return <span className={className}>{children}</span>
  return (
    <a href={href} className={className} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}
