import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CaseMap } from "@/components/case-map"
import { Timeline } from "@/components/timeline"
import { Button } from "@/components/ui/button"
import { cloneCase, confirmConnectionForm } from "@/lib/actions"
import { getCurrentUser } from "@/lib/current"
import { connectionLabel, formatDay } from "@/lib/format"
import { mapModel } from "@/lib/map"
import { caseById, connectionViews, readStore, roomForUserCase } from "@/lib/store"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const file = caseById(id)
  return { title: file?.name ?? "File" }
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const file = caseById(id)
  if (!file) notFound()
  const user = await getCurrentUser()
  const existing = user ? await roomForUserCase(user.id, file.id) : null
  const store = await readStore()
  const links = connectionViews(store, file.id)
  const { pins, lines } = mapModel(file.id, connectionViews(store))
  const milestones = file.timeline.map((item) => ({ ...item, authorName: "Public file" }))

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/archive" className="hover:text-foreground">
          Archive
        </Link>
        <span className="px-2">/</span>
        <span>{file.index}</span>
      </p>
      <div className="mt-6 grid items-end gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase">
            Demonstration file · Open
          </p>
          <h1 className="mt-3 font-heading text-6xl leading-[0.92] font-light tracking-tight sm:text-7xl">
            {file.name}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {file.age} · last seen {formatDay(file.lastSeen)} · {file.city}, {file.region}
          </p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card/50 p-4">
          <p className="text-xs leading-5 text-muted-foreground">{file.summary}</p>
          {existing ? (
            <Button render={<Link href={`/room/${existing.id}`} />} className="mt-4 h-10 px-4" nativeButton={false}>
              Open your room
            </Button>
          ) : (
            <form action={cloneCase} className="mt-4">
              <input type="hidden" name="caseId" value={file.id} />
              <Button type="submit" className="h-10 px-4">
                {user ? "Clone into a private room" : "Sign in to clone"}
              </Button>
            </form>
          )}
        </div>
      </div>
      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
        <section>
          <h2 className="mb-5 font-heading text-3xl font-light">Official timeline</h2>
          <Timeline items={milestones} />
        </section>
        <aside className="grid gap-6 lg:sticky lg:top-20">
          <CaseMap pins={pins} lines={lines} />
          {links.length > 0 ? (
            <ul className="grid gap-3">
              {links.map((link) => (
                <li key={link.id} className="rounded-2xl border border-border/80 p-4 text-sm leading-6">
                  <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                    {connectionLabel(link.type)} · {link.confirmed ? "Confirmed" : "Unconfirmed"}
                  </p>
                  <p className="mt-2">
                    {link.fromName} · {link.toName}
                  </p>
                  <p className="mt-2 text-foreground/85">{link.note}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Opened by {link.ownerName}
                    {link.confirmedNames.length ? ` · confirmed by ${link.confirmedNames.join(", ")}` : ""}
                  </p>
                  {user && !link.confirmed && user.id !== link.ownerId ? (
                    <form action={confirmConnectionForm} className="mt-3">
                      <input type="hidden" name="linkId" value={link.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Confirm this claim
                      </Button>
                    </form>
                  ) : null}
                  {user && !link.confirmed && user.id === link.ownerId ? (
                    <p className="mt-3 text-xs text-muted-foreground">Waiting for a second volunteer.</p>
                  ) : null}
                  {!user && !link.confirmed ? (
                    <p className="mt-3 text-xs text-muted-foreground">Sign in to confirm this claim.</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="text-sm leading-6">
            <p>{file.circumstances}</p>
            <p className="mt-4 text-muted-foreground">
              {file.agency}
              <br />
              {file.agencyPhone}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Fictional file for the prototype. Not a real person, and not for investigative use.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
