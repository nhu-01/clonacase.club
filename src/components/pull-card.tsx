"use client"

import { useRouter } from "next/navigation"
import type { KeyboardEvent, MouseEvent } from "react"
import { LocalWhen } from "@/components/local-when"
import { PullDecision } from "@/components/pull-decision"
import type { PullKind, PullStatus } from "@/lib/types"

export type PullCardData = {
  id: string
  status: PullStatus
  kind: PullKind
  title: string
  body: string
  url: string
  mediaKind: string
  caseName: string
  authorName: string
  targetOwnerName: string
  targetRoomId: string
  createdAt: string
}

function kindLabel(kind: PullKind) {
  if (kind === "note") return "Note"
  if (kind === "media") return "Media"
  return "Hypothetical"
}

function statusLabel(status: PullStatus) {
  if (status === "open") return "Open"
  if (status === "accepted") return "Accepted"
  return "Declined"
}

function interactive(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("button, a, input, textarea, select, form"))
}

export function PullCard({
  pull,
  incoming,
  delay = 0,
}: {
  pull: PullCardData
  incoming: boolean
  delay?: number
}) {
  const router = useRouter()
  const href = `/repository/${pull.targetRoomId}?pull=${pull.id}`

  function travel() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!reduce) window.dispatchEvent(new CustomEvent("clonacase:open", { detail: "Opening the pull request" }))
    window.setTimeout(() => router.push(href), reduce ? 0 : 780)
  }

  function onClick(event: MouseEvent<HTMLLIElement>) {
    if (interactive(event.target)) return
    travel()
  }

  function onKeyDown(event: KeyboardEvent<HTMLLIElement>) {
    if (event.key !== "Enter" && event.key !== " ") return
    if (interactive(event.target)) return
    event.preventDefault()
    travel()
  }

  return (
    <li
      className="pull-card rise w-fit max-w-full border border-primary/30 bg-card/40 px-3 py-2.5 sm:max-w-md"
      style={{ animationDelay: `${delay}s` }}
      tabIndex={0}
      role="link"
      aria-label={`Open ${pull.title} on the original repository`}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <p className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">
        {statusLabel(pull.status)} · {kindLabel(pull.kind)} · {pull.caseName}
      </p>
      <h3 className="mt-1 font-heading text-xl leading-tight font-light">{pull.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {incoming ? `From ${pull.authorName}` : `To ${pull.targetOwnerName}`} · <LocalWhen iso={pull.createdAt} />
      </p>
      {pull.body ? <p className="mt-2 text-sm leading-5">{pull.body}</p> : null}
      {pull.url ? (
        <a
          href={pull.url}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-block max-w-full truncate text-sm text-primary underline decoration-primary/40 underline-offset-4"
        >
          {pull.mediaKind || "Link"}
        </a>
      ) : null}
      {incoming && pull.status === "open" ? (
        <div className="mt-3">
          <PullDecision id={pull.id} />
        </div>
      ) : null}
    </li>
  )
}
