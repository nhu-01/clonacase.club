import { daysBetween, formatDayLong } from "@/lib/format"
import type { Brief, Milestone } from "@/lib/types"

export function composeBrief(name: string, milestones: Milestone[]): Brief {
  const sorted = [...milestones].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const sourced = sorted.filter((item) => item.kind === "sourced")
  const leads = sorted.filter((item) => item.kind === "lead")
  const unresolved = sorted.filter((item) => item.kind === "inconclusive")

  let narrative: string
  if (sourced.length === 0) {
    narrative = `There is no sourced milestone on this timeline for ${name}. The draft cannot describe a sequence.`
  } else if (sourced.length === 1) {
    const only = sourced[0]
    narrative = `One sourced event is on the timeline for ${name}. On ${formatDayLong(only.date)}, ${only.title}. ${only.body}`
  } else {
    const first = sourced[0]
    const last = sourced[sourced.length - 1]
    const beats = sourced
      .map((item) => `On ${formatDayLong(item.date)}, ${item.title}.`)
      .join(" ")
    narrative = `${name}’s sourced record holds ${sourced.length} events, from ${formatDayLong(first.date)} through ${formatDayLong(last.date)}. ${beats}`
  }

  const gaps: Brief["gaps"] = []
  for (let index = 1; index < sourced.length; index += 1) {
    const previous = sourced[index - 1]
    const current = sourced[index]
    const span = daysBetween(previous.date, current.date)
    if (span >= 10) {
      gaps.push({
        text: `${span} days sit between “${previous.title}” and “${current.title},” with no sourced event between them.`,
        ids: [previous.id, current.id],
      })
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    narrative,
    narrativeIds: sourced.map((item) => item.id),
    gaps,
    unresolved: unresolved.map((item) => ({
      id: item.id,
      text: `“${item.title}” on ${formatDayLong(item.date)} is inconclusive. ${item.body} It stays out of the sourced sequence.`,
    })),
    leads: leads.map((item) => ({
      id: item.id,
      text: `“${item.title}” on ${formatDayLong(item.date)} is a lead. ${item.body}`,
    })),
    closing:
      "This draft cites only the milestones in this room. It does not name a suspect, predict a location, or treat a link to another file as fact.",
  }
}
