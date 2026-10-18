import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { RepositoryArrive } from "@/components/clone-veil"
import { RepositoryControls, RepositoryStudio } from "@/components/repository-studio"
import { TextAlert } from "@/components/text-alert"
import { agentLine, drainInbox, watchFor } from "@/lib/desk-agent"
import { RepositoryTake } from "@/components/repository-take"
import { WashingtonDossier } from "@/components/washington-dossier"
import { getCurrentUser } from "@/lib/current"
import { posterTimeline } from "@/lib/mongo"
import { getRoom, listPulls, pullForUser, takesFor } from "@/lib/store"
import { washingtonById } from "@/lib/washington-public"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return { title: "Repository" }
  const room = await getRoom(id, user.id)
  return { title: room ? room.caseFile.name : "Repository" }
}

export default async function RepositoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ pull?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=/repository/${id}`)
  const room = await getRoom(id, user.id)
  if (!room) notFound()
  if (room.locked) {
    return (
      <div className="mx-auto w-full max-w-xl px-5 py-20">
        <h1 className="font-heading text-4xl font-light">This repository is private.</h1>
        <p className="mt-4 text-sm text-muted-foreground">Only the person who cloned it can open it.</p>
      </div>
    )
  }

  const record = washingtonById(room.caseFile.id)
  const events = record ? await posterTimeline(record.id) : null
  const fromMongo = Boolean(events && events.length > 0)
  const owner = room.clone.ownerId === user.id
  const lineage = room.clone.lineage
  const takes = owner ? { cloneId: null, forkId: null } : await takesFor(user.id, room.clone.id)
  const { sent, received } = await listPulls(user.id)
  const incoming = received.filter((pull) => pull.targetRoomId === room.clone.id && pull.status === "open")
  const proposals = sent.filter((pull) => pull.sourceRoomId === room.clone.id)
  const notes = room.milestones
    .filter((item) => item.origin === "room")
    .map((item) => ({
      id: item.id,
      date: item.date,
      title: item.title,
      body: item.body,
      createdAt: item.createdAt,
      pullId: item.pullId,
    }))
  const requested = query.pull ? await pullForUser(user.id, query.pull) : null
  const spotlight = requested && requested.targetRoomId === room.clone.id ? requested : null
  const watch = await watchFor(user.id, "repository", room.clone.id)
  if (agentLine()) await drainInbox().catch(() => undefined)

  return (
    <div className="repo-arrive mx-auto w-full max-w-5xl px-5 py-12 pb-28">
      <RepositoryArrive />
      <p className="text-sm text-muted-foreground">
        <Link href="/rooms" className="hover:text-foreground">
          Repository
        </Link>
        <span className="px-2">/</span>
        <Link href={`/records/${room.caseFile.id}`} className="hover:text-foreground">
          Public poster
        </Link>
      </p>
      {lineage === "cloned" || lineage === "fork" ? (
        <p className="mt-6 border border-primary/30 bg-card/40 px-4 py-3 text-sm leading-6">
          <span className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">
            {lineage === "cloned" ? "Cloned" : "Fork"}
          </span>
          <span className="mt-1 block text-muted-foreground">
            {lineage === "cloned"
              ? `Cloned from ${room.clone.sourceOwnerName}. This copy is private.`
              : `Forked from ${room.clone.sourceOwnerName}. A new note, media item, or hypothetical event is a pull request to the original repository. It does not go there until it is accepted.`}
          </span>
          {room.clone.sourceRoomId ? (
            <Link href={`/repository/${room.clone.sourceRoomId}`} className="mt-2 inline-block text-xs text-foreground underline decoration-primary/40 underline-offset-4">
              Open the original repository
            </Link>
          ) : null}
        </p>
      ) : null}
      {record ? (
        <WashingtonDossier
          record={record}
          events={fromMongo ? events ?? undefined : undefined}
          fromMongo={fromMongo}
          action={
            owner ? (
              <RepositoryControls
                roomId={room.clone.id}
                visibility={room.clone.visibility}
                shareable={lineage !== "fork"}
              />
            ) : (
              <RepositoryTake
                roomId={room.clone.id}
                ownerName={room.clone.ownerName}
                cloneId={takes.cloneId}
                forkId={takes.forkId}
              />
            )
          }
        />
      ) : (
        <header className="mt-8">
          <h1 className="font-heading text-5xl font-light">{room.caseFile.name}</h1>
        </header>
      )}
      {owner && incoming.length > 0 ? (
        <p className="mt-6 text-sm">
          <Link href="/pulls" className="text-primary underline decoration-primary/40 underline-offset-4">
            {incoming.length} open pull {incoming.length === 1 ? "request" : "requests"}
          </Link>
          <span className="text-muted-foreground"> waiting on this desk.</span>
        </p>
      ) : null}
      {lineage === "fork" && proposals.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-heading text-3xl font-light">Pull requests from this fork</h2>
          <ul className="mt-4 divide-y divide-primary/20 border-y border-primary/25">
            {proposals.map((pull) => (
              <li key={pull.id} className="py-3">
                <p className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">
                  {pull.status} · {pull.kind}
                </p>
                <p className="mt-1 font-heading text-xl font-light">{pull.title}</p>
              </li>
            ))}
          </ul>
          <Link href="/pulls" className="mt-3 inline-block text-xs text-muted-foreground underline decoration-primary/30 underline-offset-4">
            All pull requests
          </Link>
        </section>
      ) : null}
      <TextAlert
        kind="repository"
        targetId={room.clone.id}
        line={agentLine()}
        phone={watch?.phone ?? ""}
        watching={Boolean(watch)}
      />
      <RepositoryStudio
        roomId={room.clone.id}
        canEdit={owner && lineage !== "fork"}
        propose={owner && lineage === "fork"}
        notes={notes}
        media={room.clone.media}
        hypothetical={room.clone.hypothetical}
        spotlight={spotlight}
      />
    </div>
  )
}
