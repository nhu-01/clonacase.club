import { getCurrentUser } from "@/lib/current"
import { openPullCount } from "@/lib/store"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return Response.json({ count: 0 })
  const count = await openPullCount(user.id)
  return Response.json({ count }, { headers: { "cache-control": "no-store" } })
}
