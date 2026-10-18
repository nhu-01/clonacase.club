import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { PullCard } from "@/components/pull-card"
import { getCurrentUser } from "@/lib/current"
import { listPulls } from "@/lib/store"

export const metadata: Metadata = { title: "Pull requests" }

export default async function PullsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/pulls")
  const { sent, received } = await listPulls(user.id)

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14">
      <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">PRs</p>
      <h1 className="mt-4 font-heading text-5xl font-light tracking-tight sm:text-6xl">Pull requests</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
        A fork does not write onto the original repository. A note, a media link, or a hypothetical event waits here until that repository accepts it. A hypothetical line is a reading, not a finding.
      </p>

      <section className="mt-12">
        <h2 className="font-heading text-3xl font-light">Received</h2>
        {received.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No pull requests have come in.</p>
        ) : (
          <ul className="mt-4 flex flex-col items-start gap-2.5">
            {received.map((pull, index) => (
              <PullCard key={pull.id} pull={pull} incoming delay={index * 0.04} />
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
          <ul className="mt-4 flex flex-col items-start gap-2.5">
            {sent.map((pull) => (
              <PullCard key={pull.id} pull={pull} incoming={false} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
