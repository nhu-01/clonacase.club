import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { PullDecision } from "@/components/pull-decision"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/current"
import { formatDay, formatWhen } from "@/lib/format"
import { pullForUser } from "@/lib/store"
import type { PullKind, PullStatus } from "@/lib/types"

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return { title: "Pull request" }
  const pull = await pullForUser(user.id, id)
  return { title: pull ? pull.title : "Pull request" }
}

export default async function PullPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=/pulls/${id}`)
  const pull = await pullForUser(user.id, id)
  if (!pull) notFound()

  const roomHref = pull.incoming ? `/repository/${pull.targetRoomId}` : `/repository/${pull.sourceRoomId}`
  const roomLabel = pull.incoming ? "Open your repository" : "Open your fork"

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14">
      <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">
        <Link href="/pulls" className="hover:text-foreground">
          PRs
        </Link>
      </p>
      <h1 className="mt-4 max-w-3xl font-heading text-5xl font-light tracking-tight sm:text-6xl">{pull.title}</h1>
      <p className="mt-4 font-mono text-[11px] tracking-[0.16em] text-primary uppercase">
        {statusLabel(pull.status)} · {kindLabel(pull.kind)} · {pull.caseName}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        {pull.incoming ? `From ${pull.authorName}` : `To ${pull.targetOwnerName}`} · {formatWhen(pull.createdAt)}
        {pull.date ? ` · dated ${formatDay(pull.date)}` : ""}
      </p>
      {pull.body ? <p className="mt-8 max-w-xl text-sm leading-6">{pull.body}</p> : null}
      {pull.url ? (
        <a
          href={pull.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block max-w-full truncate text-sm text-primary underline decoration-primary/40 underline-offset-4"
        >
          {pull.mediaKind || "Link"}
        </a>
      ) : null}
      <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground">
        {pull.kind === "hypothetical"
          ? "This line is a reading of the poster, not a finding. It names no suspect."
          : "This stays off the original repository until it is accepted."}
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {pull.incoming && pull.status === "open" ? <PullDecision id={pull.id} /> : null}
        <Button
          render={<Link href={roomHref} />}
          nativeButton={false}
          variant="outline"
          className="h-8 border-primary/40 px-3 text-xs"
        >
          {roomLabel}
        </Button>
      </div>
    </div>
  )
}
