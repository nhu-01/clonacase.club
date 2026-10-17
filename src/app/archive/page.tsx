import type { Metadata } from "next"
import Link from "next/link"
import { Rise } from "@/components/motion"
import { getCurrentUser } from "@/lib/current"
import { formatDay, kindLabel } from "@/lib/format"
import { allCases, readStore } from "@/lib/store"

export const metadata: Metadata = { title: "Archive" }

export default async function ArchivePage() {
  const user = await getCurrentUser()
  const cases = allCases()
  const store = await readStore()
  const owned = new Set(
    user ? store.clones.filter((clone) => clone.ownerId === user.id).map((clone) => clone.caseId) : [],
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14">
      <Rise>
        <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">Open files</p>
        <h1 className="mt-4 max-w-2xl font-heading text-5xl leading-none font-light tracking-tight sm:text-6xl">
          Three demonstration files.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
          Each file is fictional and already public inside Hearth. Clone one into a private room
          before you add a note. The original timeline does not change.
        </p>
        {process.env.VERCEL ? (
          <p className="mt-4 max-w-xl text-xs leading-5 text-muted-foreground">
            On this host, rooms live in the server’s memory and reset when it sleeps.
          </p>
        ) : null}
      </Rise>
      <dl className="mt-12 grid gap-3 border-t border-border/80 pt-6 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-sourced">Sourced</dt>
          <dd className="mt-1 text-muted-foreground">Tied to a named source.</dd>
        </div>
        <div>
          <dt className="text-lead">Lead</dt>
          <dd className="mt-1 text-muted-foreground">Worth keeping. Not established.</dd>
        </div>
        <div>
          <dt className="text-inconclusive">Inconclusive</dt>
          <dd className="mt-1 text-muted-foreground">The record does not settle it.</dd>
        </div>
      </dl>
      <div className="mt-10 divide-y divide-border/80 border-y border-border/80">
        {cases.map((file, index) => (
          <Rise key={file.id} delay={0.05 * index}>
            <Link
              href={`/cases/${file.id}`}
              className="group grid gap-3 py-7 transition-colors sm:grid-cols-[4rem_1.4fr_1fr_auto] sm:items-end"
            >
              <span className="font-mono text-xs tracking-[0.18em] text-muted-foreground">{file.index}</span>
              <span>
                <span className="block font-heading text-4xl font-light tracking-tight transition-colors group-hover:text-primary">
                  {file.name}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {file.age} · last seen {formatDay(file.lastSeen)}
                </span>
              </span>
              <span className="text-sm text-muted-foreground">
                {file.city}, {file.region}
                <span className="mt-1 block">
                  {file.timeline.filter((item) => item.kind === "sourced").length} sourced ·{" "}
                  {file.timeline
                    .filter((item) => item.kind !== "sourced")
                    .map((item) => kindLabel(item.kind))
                    .filter((label, labelIndex, all) => all.indexOf(label) === labelIndex)
                    .join(" · ")}
                </span>
              </span>
              <span className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">
                {owned.has(file.id) ? "Your room" : "Open"}
              </span>
            </Link>
          </Rise>
        ))}
      </div>
    </div>
  )
}
