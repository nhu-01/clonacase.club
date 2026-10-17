import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { JoinPanel } from "@/components/join-panel"
import { getCurrentUser } from "@/lib/current"
import { safeNext } from "@/lib/format"

export const metadata: Metadata = { title: "Choose a username" }

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams
  const nextPath = safeNext(params.next)
  const user = await getCurrentUser()
  if (user) redirect(nextPath)
  return <JoinPanel nextPath={nextPath} />
}
