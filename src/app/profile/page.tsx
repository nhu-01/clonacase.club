import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ContributionActivity, ContributionChart } from "@/components/contribution-chart"
import { Rise } from "@/components/motion"
import { collectContributions } from "@/lib/contributions"
import { getCurrentUser } from "@/lib/current"
import { readStore } from "@/lib/store"

export const metadata: Metadata = { title: "Profile" }

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/profile")
  const profile = collectContributions(await readStore(), user.id)

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14">
      <Rise>
        <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">Profile</p>
        <h1 className="mt-4 flex items-center gap-3 font-heading text-5xl font-light tracking-tight sm:text-6xl">
          <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-primary" />
          {user.name}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          Private clones and new info from the last year. A clone of a poster, a note, a source, a hypothetical event, or a pull request each fill a day.
        </p>
      </Rise>
      <div className="mt-12">
        <ContributionChart profile={profile} />
        <ContributionActivity profile={profile} />
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        <Link href="/rooms" className="text-foreground underline decoration-border underline-offset-4">
          Your repositories
        </Link>
      </p>
    </div>
  )
}
