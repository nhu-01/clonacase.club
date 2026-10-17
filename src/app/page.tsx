import { Landing } from "@/components/landing"
import { getCurrentUser } from "@/lib/current"
import { allCases } from "@/lib/store"

export default async function HomePage() {
  const user = await getCurrentUser()
  const files = allCases().map((file) => ({
    id: file.id,
    name: file.name,
    age: file.age,
    city: file.city,
    region: file.region,
  }))
  return <Landing signedIn={Boolean(user)} files={files} />
}
