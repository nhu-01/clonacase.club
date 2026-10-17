import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { RepositoryDesk } from "@/components/repository-desk"
import { getCurrentUser } from "@/lib/current"
import { getRoom } from "@/lib/store"

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

  return (
    <RepositoryDesk
      roomId={room.clone.id}
      caseId={room.caseFile.id}
      caseName={room.caseFile.name}
      place={`${room.caseFile.city}`}
      visibility={room.clone.visibility}
      note={room.clone.note}
      canEdit={room.clone.ownerId === user.id}
      brief={room.brief}
      notes={room.milestones.map((item) => ({
        id: item.id,
        date: item.date,
        title: item.title,
        body: item.body,
        kind: item.kind,
        sourceLabel: item.sourceLabel,
        sourceUrl: item.sourceUrl,
        imageUrl: item.imageUrl,
        origin: item.origin,
        authorName: item.authorName,
      }))}
    />
  )
}
