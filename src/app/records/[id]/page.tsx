import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { WashingtonDossier } from "@/components/washington-dossier"
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
    </div>
  )
}
