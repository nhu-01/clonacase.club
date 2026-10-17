import { findUserById } from "@/lib/store"
import { readSessionUserId } from "@/lib/session"
import type { PublicUser } from "@/lib/types"

export async function getCurrentUser(): Promise<PublicUser | null> {
  const id = await readSessionUserId()
  if (!id) return null
  const user = await findUserById(id)
  if (!user) return null
  return { id: user.id, name: user.name, email: user.email }
}
