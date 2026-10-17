import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LoginPanel } from "@/components/login-panel"
import { getCurrentUser } from "@/lib/current"
import { safeNext } from "@/lib/format"

export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams
  const nextPath = safeNext(params.next)
  const user = await getCurrentUser()
  if (user) redirect(nextPath)
  return <LoginPanel nextPath={nextPath} />
}
