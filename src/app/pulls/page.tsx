import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { PullDecision } from "@/components/pull-decision"
import { Rise } from "@/components/motion"
import { getCurrentUser } from "@/lib/current"
import { formatDay, formatWhen } from "@/lib/format"
import { listPulls } from "@/lib/store"
import type { PullKind, PullStatus } from "@/lib/types"

export const metadata: Metadata = { title: "Pull requests" }

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

export default async function PullsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/pulls")
  const { sent, received } = await listPulls(user.id)

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14">
      <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">PRs</p>
      <h1 className="mt-4 font-heading text-5xl font-light tracking-tight sm:text-6xl">Pull requests</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
        A fork does not write onto someone else’s desk. A note, a media link, or a hypothetical event waits here until the original repository accepts it. A hypothetical line is a reading, not a finding.
      </p>

      <section className="mt-12">
        <h2 className="font-heading text-3xl font-light">Received</h2>
        {received.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No pull requests have come in.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {received.map((pull, index) => (
              <Rise key={pull.id} delay={index * 0.04}>
                <li className="border border-primary/30 bg-card/40 px-4 py-4">
                  <p className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">
                    {statusLabel(pull.status)} · {kindLabel(pull.kind)} · {pull.caseName}
                  </p>
                  <h3 className="mt-2 font-heading text-2xl font-light">{pull.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    From {pull.authorName} · {formatWhen(pull.createdAt)}
                    {pull.date ? ` · dated ${formatDay(pull.date)}` : ""}
                  </p>
                  {pull.body ? <p className="mt-3 text-sm leading-6">{pull.body}</p> : null}
                  {pull.url ? (
                    <a href={pull.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary underline decoration-primary/40 underline-offset-4">
                      {pull.mediaKind || "Link"}
                    </a>
                  ) : null}
                  <p className="mt-3 text-xs text-muted-foreground">
                    <Link href={`/repository/${pull.targetRoomId}`} className="underline decoration-primary/30 underline-offset-4">
                      Open your repository
                    </Link>
                  </p>
                  {pull.status === "open" ? <PullDecision id={pull.id} /> : null}
                </li>
              </Rise>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14">
        <h2 className="font-heading text-3xl font-light">Sent</h2>
        {sent.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            You have not sent one. Fork a public repository, then propose a note.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {sent.map((pull) => (
              <li key={pull.id} className="border border-primary/25 px-4 py-4">
                <p className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">
                  {statusLabel(pull.status)} · {kindLabel(pull.kind)} · {pull.caseName}
                </p>
                <h3 className="mt-2 font-heading text-2xl font-light">{pull.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  To {pull.targetOwnerName} · {formatWhen(pull.createdAt)}
                </p>
                {pull.body ? <p className="mt-3 text-sm leading-6">{pull.body}</p> : null}
                <p className="mt-3 text-xs text-muted-foreground">
                  <Link href={`/repository/${pull.sourceRoomId}`} className="underline decoration-primary/30 underline-offset-4">
                    Open your fork
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
