import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { RoomDesk } from "@/components/room-desk"
import { getCurrentUser } from "@/lib/current"
import { mapModel } from "@/lib/map"
import { connectionViews, getRoom, readStore } from "@/lib/store"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return { title: "Room" }
  const room = await getRoom(id, user.id)
  return { title: room ? room.caseFile.name : "Room" }
}

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=/room/${id}`)
  const room = await getRoom(id, user.id)
  if (!room) notFound()
  const store = await readStore()
  const { pins, lines } = mapModel(room.caseFile.id, connectionViews(store))
  return <RoomDesk room={room} user={user} pins={pins} lines={lines} />
}
