import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/current"
import { pullForUser } from "@/lib/store"

export const metadata: Metadata = { title: "Pull request" }

export default async function PullPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=/pulls/${id}`)
  const pull = await pullForUser(user.id, id)
  if (!pull) notFound()
  redirect(`/repository/${pull.targetRoomId}?pull=${pull.id}`)
}
