import Link from "next/link"
import { PullDecision } from "@/components/pull-decision"
import { Button } from "@/components/ui/button"
import { formatDay, formatWhen } from "@/lib/format"
import type { PullKind, PullStatus } from "@/lib/types"

export type PullCardData = {
  id: string
  status: PullStatus
  kind: PullKind
  title: string
  body: string
  date: string
  url: string
  mediaKind: string
  caseName: string
  authorName: string
  targetOwnerName: string
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

export function PullCard({
  pull,
  incoming,
  delay = 0,
}: {
  pull: PullCardData
  incoming: boolean
  delay?: number
}) {
  return (
    <li
      className="rise w-fit max-w-full border border-primary/30 bg-card/40 px-3 py-2.5 sm:max-w-md"
      style={{ animationDelay: `${delay}s` }}
    >
      <p className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">
        {statusLabel(pull.status)} · {kindLabel(pull.kind)} · {pull.caseName}
      </p>
      <h3 className="mt-1 font-heading text-xl leading-tight font-light">
        <Link href={`/pulls/${pull.id}`} className="hover:text-primary">
          {pull.title}
        </Link>
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {incoming ? `From ${pull.authorName}` : `To ${pull.targetOwnerName}`} · {formatWhen(pull.createdAt)}
        {pull.date ? ` · dated ${formatDay(pull.date)}` : ""}
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
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          render={<Link href={`/pulls/${pull.id}`} />}
          nativeButton={false}
          variant="outline"
          className="h-8 border-primary/40 px-3 text-xs"
        >
          Open
        </Button>
        {incoming && pull.status === "open" ? <PullDecision id={pull.id} /> : null}
      </div>
    </li>
  )
}
