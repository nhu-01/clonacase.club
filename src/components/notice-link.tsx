"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

export function NoticeLink({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial)
  const pathname = usePathname()
  const router = useRouter()
  const countRef = useRef(initial)
  const pathRef = useRef(pathname)
  const refreshedFor = useRef<number | null>(null)
  pathRef.current = pathname

  useEffect(() => {
    countRef.current = initial
    setCount(initial)
  }, [initial])

  useEffect(() => {
    let cancelled = false

    async function pull() {
      try {
        const response = await fetch("/api/notices", { cache: "no-store" })
        if (!response.ok || cancelled) return
        const data = (await response.json()) as { count?: unknown }
        const next = typeof data.count === "number" ? data.count : 0
        if (next === countRef.current) return
        countRef.current = next
        setCount(next)
        if (pathRef.current.startsWith("/pulls") && refreshedFor.current !== next) {
          refreshedFor.current = next
          router.refresh()
        }
      } catch {
        // Keep the last count if the desk is briefly unreachable.
      }
    }

    const first = window.setTimeout(pull, 400)
    const id = window.setInterval(pull, 3000)
    const onVisible = () => {
      if (document.visibilityState === "visible") pull()
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", pull)
    return () => {
      cancelled = true
      window.clearTimeout(first)
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", pull)
    }
  }, [router])

  return (
    <Link
      href="/pulls"
      aria-label={count > 0 ? `PRs, ${count} waiting` : "PRs"}
      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:text-foreground sm:px-2"
    >
      PRs
      {count > 0 ? (
        <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] leading-5 font-medium text-primary-foreground">
          {count}
        </span>
      ) : null}
    </Link>
  )
}
