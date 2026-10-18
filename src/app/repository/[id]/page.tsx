import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { RepositoryArrive } from "@/components/clone-veil"
import { RepositoryControls, RepositoryStudio } from "@/components/repository-studio"
import { WashingtonDossier } from "@/components/washington-dossier"
import { getCurrentUser } from "@/lib/current"
import { posterTimeline } from "@/lib/mongo"
import { getRoom } from "@/lib/store"
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

export default async function RepositoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
  const notes = room.milestones
    .filter((item) => item.origin === "room")
    .map((item) => ({ id: item.id, date: item.date, title: item.title, body: item.body }))

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
      {record ? (
        <WashingtonDossier
          record={record}
          events={fromMongo ? events ?? undefined : undefined}
          fromMongo={fromMongo}
          action={owner ? <RepositoryControls roomId={room.clone.id} visibility={room.clone.visibility} /> : null}
        />
      ) : (
        <header className="mt-8">
          <h1 className="font-heading text-5xl font-light">{room.caseFile.name}</h1>
        </header>
      )}
      <RepositoryStudio
        roomId={room.clone.id}
        canEdit={owner}
        notes={notes}
        media={room.clone.media}
        hypothetical={room.clone.hypothetical}
      />
    </div>
  )
}
