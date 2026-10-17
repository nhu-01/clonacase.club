import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Reading group caption" }

export default function ReadingGroupSource() {
  return (
    <article className="mx-auto w-full max-w-2xl px-5 py-16">
      <p className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase">Demonstration source</p>
      <h1 className="mt-4 font-heading text-5xl leading-none font-light">Monday reading group</h1>
      <p className="mt-3 text-sm text-muted-foreground">Fictional neighborhood caption · 4 March 2024</p>
      <p className="mt-8 text-base leading-7">
        Attending on Monday: Mara Ellison, Helen Cho, and six other neighbors. The group read the
        first chapter and broke up at nine. This page is the source attached to that milestone and
        to the unconfirmed link between the two files.
      </p>
      <p className="mt-6 text-sm leading-6 text-muted-foreground">
        It is not a record of real people. A shared caption does not make two disappearances one
        case.
      </p>
      <p className="mt-10 text-sm">
        <Link href="/cases/case-mara" className="underline decoration-border underline-offset-4">
          Mara Ellison
        </Link>
        <span className="px-2 text-muted-foreground">·</span>
        <Link href="/cases/case-helen" className="underline decoration-border underline-offset-4">
          Helen Cho
        </Link>
      </p>
    </article>
  )
}
