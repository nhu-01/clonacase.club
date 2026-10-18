import Link from "next/link"
import {
  contributionLevel,
  formatContributionDay,
  type ContributionProfile,
} from "@/lib/contributions"

const LEVEL = [
  "bg-[oklch(0.24_0.012_58)]",
  "bg-[oklch(0.46_0.07_78)]",
  "bg-[oklch(0.58_0.09_78)]",
  "bg-[oklch(0.7_0.1_78)]",
  "bg-primary",
]

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""]

export function ContributionChart({ profile }: { profile: ContributionProfile }) {
  const noun = profile.total === 1 ? "contribution" : "contributions"

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-heading text-3xl font-light">{profile.total} {noun} in the last year</h2>
        <p className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">
          {profile.clones} private {profile.clones === 1 ? "clone" : "clones"} · {profile.additions} new info
        </p>
      </div>
      <div className="mt-6 overflow-x-auto pb-1">
        <div className="w-max">
          <div className="grid grid-flow-col gap-[3px] pl-8" style={{ gridTemplateRows: "14px", gridAutoColumns: "11px" }}>
            {profile.weeks.map((week, column) => {
              const label = profile.monthLabels.find((month) => month.column === column)
              return (
                <div key={week[0]?.day ?? column} className="font-mono text-[10px] leading-none text-muted-foreground">
                  {label?.label ?? ""}
                </div>
              )
            })}
          </div>
          <div className="mt-1 flex gap-2">
            <div className="grid gap-[3px] text-[10px] leading-[11px] text-muted-foreground" style={{ gridTemplateRows: "repeat(7, 11px)" }}>
              {DAY_LABELS.map((label, index) => (
                <span key={index} className="w-6 text-left font-mono">
                  {label}
                </span>
              ))}
            </div>
            <div className="grid grid-flow-col gap-[3px]" style={{ gridTemplateRows: "repeat(7, 11px)", gridAutoColumns: "11px" }}>
              {profile.weeks.map((week) =>
                week.map((day) => {
                  if (day.day > profile.today) return <span key={day.day} className="size-[11px]" />
                  const level = contributionLevel(day.count)
                  const label =
                    day.count === 0
                      ? `No contributions on ${formatContributionDay(day.day)}`
                      : `${day.count} ${day.count === 1 ? "contribution" : "contributions"} on ${formatContributionDay(day.day)}`
                  return <span key={day.day} title={label} className={`size-[11px] rounded-[2px] ${LEVEL[level]}`} />
                }),
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-1.5 pr-1 font-mono text-[10px] text-muted-foreground">
            Less
            {LEVEL.map((tone) => (
              <span key={tone} className={`size-[11px] rounded-[2px] ${tone}`} />
            ))}
            More
          </div>
        </div>
      </div>
    </section>
  )
}

export function ContributionActivity({ profile }: { profile: ContributionProfile }) {
  return (
    <section className="mt-14">
      <h2 className="font-heading text-3xl font-light">Activity</h2>
      {profile.activity.length === 0 ? (
        <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
          Nothing in the last year. A private clone, a note, a source, or a hypothetical event shows up here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border/80 border-y border-border/80">
          {profile.activity.map((event) => (
            <li key={event.id}>
              <Link href={event.href} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <span className="min-w-0">
                  <span className="block text-sm text-foreground">{event.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{event.detail}</span>
                </span>
                <span className="shrink-0 font-mono text-[11px] tracking-[0.14em] text-primary uppercase">
                  {formatContributionDay(event.day)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
