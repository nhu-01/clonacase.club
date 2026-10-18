"use client"

import { useEffect, useRef } from "react"
import { LocalWhen } from "@/components/local-when"
import { PullDecision } from "@/components/pull-decision"
import type { PullKind, PullStatus } from "@/lib/types"

export type SpotlightPull = {
  id: string
  kind: PullKind
  status: PullStatus
  title: string
  body: string
  url: string
  mediaKind: string
  authorName: string
  createdAt: string
  incoming: boolean
}

export function usePullScroll(active: boolean) {
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => {
    if (!active) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const id = window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" })
    }, reduce ? 0 : 320)
    return () => window.clearTimeout(id)
  }, [active])
  return ref
}

export function PullSpotlight({ pull, wide = false }: { pull: SpotlightPull; wide?: boolean }) {
  const ref = usePullScroll(true)
  return (
    <li ref={ref} id={`pull-${pull.id}`} className={`pull-highlight border border-primary/40 px-4 py-4 ${wide ? "sm:col-span-2" : ""}`}>
      <p className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">
        Pull request · {pull.status === "open" ? "Open" : pull.status === "accepted" ? "Accepted" : "Declined"} · {pull.authorName}
      </p>
      <h3 className="mt-1 font-heading text-2xl font-light">{pull.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        <LocalWhen iso={pull.createdAt} />
      </p>
      {pull.body ? <p className="mt-2 text-sm leading-6">{pull.body}</p> : null}
      {pull.url ? (
        <a href={pull.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-primary underline decoration-primary/40 underline-offset-4">
          {pull.mediaKind || "Link"}
        </a>
      ) : null}
      {pull.incoming && pull.status === "open" ? (
        <div className="mt-3">
          <PullDecision id={pull.id} />
        </div>
      ) : null}
    </li>
  )
}
