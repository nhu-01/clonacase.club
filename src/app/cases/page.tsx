import type { Metadata } from "next"
import { CaseIndex } from "@/components/case-index"
import { Rise } from "@/components/motion"
import { washingtonRecords } from "@/lib/washington-public"

export const metadata: Metadata = { title: "Cases" }

export default function CasesPage() {
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
      <CaseIndex />
    </div>
  )
}
