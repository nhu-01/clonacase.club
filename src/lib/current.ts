import { readSession } from "@/lib/session"
import type { PublicUser } from "@/lib/types"

export async function getCurrentUser(): Promise<PublicUser | null> {
  const session = await readSession()
  if (!session) return null
  return { id: session.id, name: session.name, email: session.email }
}
