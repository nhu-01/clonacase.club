import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { CaseDiscussion } from "@/components/case-discussion"
import { WashingtonDossier } from "@/components/washington-dossier"
import { cloneRecord } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/current"
import { caseThreads, publicRepositories, roomForUserCase } from "@/lib/store"
import { posterTimeline } from "@/lib/mongo"
import { washingtonById } from "@/lib/washington-public"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const record = washingtonById(id)
  return { title: record?.name ?? "Record" }
}

export default async function RecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const record = washingtonById(id)
  if (!record) notFound()
  const user = await getCurrentUser()
  if (!user) redirect(`/join?next=/records/${record.id}`)
  let mine: Awaited<ReturnType<typeof roomForUserCase>> = null
  let shared: Awaited<ReturnType<typeof publicRepositories>> = []
  let posts: Awaited<ReturnType<typeof caseThreads>> = []
  try {
    mine = await roomForUserCase(user.id, record.id)
    shared = await publicRepositories(record.id)
    posts = await caseThreads(record.id)
  } catch (error) {
    console.error("The case desk did not open.", error)
  }
  const events = await posterTimeline(record.id)
  const fromMongo = Boolean(events && events.length > 0)

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Search
        </Link>
        <span className="px-2">/</span>
        <Link href="/archive" className="hover:text-foreground">
          Archive
        </Link>
      </p>
      <WashingtonDossier
        record={record}
        events={fromMongo ? events ?? undefined : undefined}
        fromMongo={fromMongo}
        action={
          mine ? (
            <Button render={<Link href={`/repository/${mine.id}`} />} className="h-11 px-5" nativeButton={false}>
              Your repository
            </Button>
          ) : (
            <form action={cloneRecord}>
              <input type="hidden" name="caseId" value={record.id} />
              <Button type="submit" className="h-11 px-5">
                Clone the case
              </Button>
            </form>
          )
        }
      />

      <section className="mt-10">
        <h2 className="font-heading text-3xl font-light">Public repositories</h2>
        {shared.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No one has shared a repository for this poster.</p>
        ) : (
          <ul className="mt-4 divide-y divide-primary/20 border-y border-primary/25">
            {shared.map((repo) => (
              <li key={repo.id}>
                <Link href={`/repository/${repo.id}`} className="block py-4">
                  <span className="font-heading text-2xl font-light">{repo.ownerName}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {repo.count} notes{repo.note ? ` · ${repo.note}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CaseDiscussion caseId={record.id} posts={posts} userId={user.id} />
    </div>
  )
}
