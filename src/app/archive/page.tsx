import type { Metadata } from "next"
import Link from "next/link"
import { Rise } from "@/components/motion"
import { washingtonRecords } from "@/lib/washington-public"

export const metadata: Metadata = { title: "Cases" }

export default function ArchivePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14">
      <Rise>
        <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">Washington State Patrol</p>
        <h1 className="mt-4 max-w-3xl font-heading text-5xl leading-none font-light tracking-tight sm:text-6xl">
          {washingtonRecords.length} adult public posters.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
          Each name is an active missing adult on the state page. Open one for the timeline, the
          photograph, and the poster.
        </p>
      </Rise>
      <div className="mt-12 divide-y divide-primary/20 border-y border-primary/25">
        {washingtonRecords.map((record, index) => (
          <Rise key={record.id} delay={Math.min(index, 8) * 0.04}>
            <Link
              href={`/records/${record.id}`}
              className="group grid gap-2 py-5 transition-colors sm:grid-cols-[1.4fr_1fr_auto] sm:items-end"
            >
              <span>
                <span className="block font-heading text-3xl font-light tracking-tight transition-colors group-hover:text-primary">
                  {record.name}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {record.age} on the poster
                  {record.lastSeen ? ` · last seen ${record.lastSeen}` : ""}
                </span>
              </span>
              <span className="text-sm text-muted-foreground">{record.place ?? "Place listed on the poster"}</span>
              <span className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">Open</span>
            </Link>
          </Rise>
        ))}
      </div>
    </div>
  )
}
