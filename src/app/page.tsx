import { Landing } from "@/components/landing"
import { getCurrentUser } from "@/lib/current"

export default async function HomePage() {
  const user = await getCurrentUser()
  return <Landing signedIn={Boolean(user)} />
}
