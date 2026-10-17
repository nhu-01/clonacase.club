import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { CaseDiscussion } from "@/components/case-discussion"
import { WashingtonDossier } from "@/components/washington-dossier"
import { cloneRecord } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/current"
import { caseThreads, publicRepositories, roomForUserCase } from "@/lib/store"
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
  const mine = await roomForUserCase(user.id, record.id)
  const shared = await publicRepositories(record.id)
  const posts = await caseThreads(record.id)

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
      <WashingtonDossier record={record} />

      <section className="mt-10 border border-primary/30 px-5 py-5 sm:px-7">
        <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">Your repository</p>
        <h2 className="mt-3 font-heading text-3xl font-light">Clone the case</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          A clone starts private. Notes, sources, and media stay in your repository until you choose to share them.
        </p>
        {mine ? (
          <Button render={<Link href={`/repository/${mine.id}`} />} className="mt-5 h-11 px-5" nativeButton={false}>
            Open your repository
          </Button>
        ) : (
          <form action={cloneRecord} className="mt-5">
            <input type="hidden" name="caseId" value={record.id} />
            <Button type="submit" className="h-11 px-5">
              Clone into your repository
            </Button>
          </form>
        )}
      </section>

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
