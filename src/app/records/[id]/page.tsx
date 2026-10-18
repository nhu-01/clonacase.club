import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { CaseDiscussion } from "@/components/case-discussion"
import { CloneCaseButton } from "@/components/clone-case"
import { Rise } from "@/components/motion"
import { TextAlert } from "@/components/text-alert"
import { agentLine, drainInbox, watchFor } from "@/lib/desk-agent"
import { WashingtonDossier } from "@/components/washington-dossier"
import { getCurrentUser } from "@/lib/current"
import { formatDay } from "@/lib/format"
import { caseThreads, publicRepositories, roomForUserCase } from "@/lib/store"
import { posterTimeline } from "@/lib/mongo"
import { washingtonById } from "@/lib/washington-public"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const record = washingtonById(id)
  return { title: record?.name ?? "Record" }
}

export default async function RecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const record = washingtonById(id)
  if (!record) notFound()
  const user = await getCurrentUser()
  if (!user) redirect(`/join?next=/records/${record.id}`)
  let mine: Awaited<ReturnType<typeof roomForUserCase>> = null
  let shared: Awaited<ReturnType<typeof publicRepositories>> = []
  let posts: Awaited<ReturnType<typeof caseThreads>> = []
  try {
    mine = await roomForUserCase(user.id, record.id)
    shared = await publicRepositories(record.id)
    posts = await caseThreads(record.id)
  } catch (error) {
    console.error("The case desk did not open.", error)
  }
  const events = await posterTimeline(record.id)
  const fromMongo = Boolean(events && events.length > 0)
  const watch = await watchFor(user.id, "case", record.id)
  if (agentLine()) await drainInbox().catch(() => undefined)

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Search
        </Link>
        <span className="px-2">/</span>
        <Link href="/cases" className="hover:text-foreground">
          Cases
        </Link>
      </p>
      <WashingtonDossier
        record={record}
        events={fromMongo ? events ?? undefined : undefined}
        fromMongo={fromMongo}
        action={<CloneCaseButton caseId={record.id} existingId={mine?.id} />}
      />
      <TextAlert
        kind="case"
        targetId={record.id}
        line={agentLine()}
        phone={watch?.phone ?? ""}
        watching={Boolean(watch)}
      />

      <section className="mt-14">
        <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">Shared desks</p>
        <h2 className="mt-3 font-heading text-4xl font-light">Public repositories</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Readings other people opened from this poster. Each desk holds notes, media, and a hypothetical line. It is not a finding.
        </p>
        {shared.length === 0 ? (
          <div className="mt-6 border border-dashed border-primary/40 bg-card/30 px-5 py-8 sm:px-7">
            <p className="font-heading text-2xl font-light">No shared desk yet.</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Clone the case, save a note, and mark the repository public once the notes name no suspect.
            </p>
          </div>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shared.map((repo, index) => {
              const initial = repo.ownerName.trim().slice(0, 1).toUpperCase() || "?"
              const line = repo.hypothetical === 1 ? "line" : "lines"
              return (
                <Rise key={repo.id} delay={index * 0.05} className="h-full">
                  <li className="h-full">
                    <Link
                      href={`/repository/${repo.id}`}
                      className="group flex h-full flex-col border border-primary/30 bg-card/55 px-3.5 py-3 transition-colors duration-300 hover:border-primary hover:bg-card"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="grid size-8 shrink-0 place-items-center border border-primary/45 bg-[oklch(0.16_0.03_18)] font-heading text-base font-light text-primary"
                        >
                          {initial}
                        </span>
                        <span className="min-w-0">
                          <span className="flex min-w-0 items-baseline gap-2">
                            <span className="truncate font-heading text-lg leading-none font-light">{repo.ownerName}</span>
                            {repo.ownerId === user.id ? (
                              <span className="shrink-0 font-mono text-[10px] tracking-[0.14em] text-primary uppercase">Yours</span>
                            ) : null}
                            {repo.lineage === "cloned" ? (
                              <span className="shrink-0 font-mono text-[10px] tracking-[0.14em] text-primary uppercase">Cloned</span>
                            ) : null}
                          </span>
                          <span className="mt-1 block font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                            Opened {formatDay(repo.createdAt)}
                          </span>
                        </span>
                      </span>
                      <p className="mt-2.5 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                        {repo.notes} {repo.notes === 1 ? "note" : "notes"} · {repo.media} media · {repo.hypothetical} {line}
                      </p>
                      {repo.preview ? (
                        <p className="mt-1.5 truncate text-sm text-foreground/90">{repo.preview}</p>
                      ) : repo.note ? (
                        <p className="mt-1.5 truncate text-sm text-muted-foreground">{repo.note}</p>
                      ) : null}
                      <span className="mt-2 font-mono text-[10px] tracking-[0.14em] text-primary uppercase">
                        Open
                        <span className="ml-1 inline-block transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                      </span>
                    </Link>
                  </li>
                </Rise>
              )
            })}
          </ul>
        )}
      </section>

      <CaseDiscussion caseId={record.id} posts={posts} userId={user.id} />
    </div>
  )
}
