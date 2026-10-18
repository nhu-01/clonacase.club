import { caseById } from "@/lib/store"
import type { Store } from "@/lib/types"

export type ContributionKind = "clone" | "info"

export type Contribution = {
  id: string
  at: string
  day: string
  kind: ContributionKind
  title: string
  detail: string
  href: string
}

export type ContributionDay = {
  day: string
  count: number
  date: Date
}

export type ContributionProfile = {
  total: number
  clones: number
  additions: number
  weeks: ContributionDay[][]
  monthLabels: { label: string; column: number }[]
  activity: Contribution[]
  today: string
}

const WEEKS = 53
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function utcDate(day: string) {
  const [year, month, date] = day.split("-").map(Number)
  return new Date(Date.UTC(year, (month || 1) - 1, date || 1))
}

function dayKey(iso: string) {
  return iso.slice(0, 10)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function caseName(caseId: string) {
  return caseById(caseId)?.name ?? "a case"
}

function article(kind: string) {
  return `${/^[aeiou]/i.test(kind) ? "an" : "a"} ${kind}`
}

export function contributionWindow(now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const start = addDays(end, -end.getUTCDay() - (WEEKS - 1) * 7)
  return { start, end }
}

export function collectContributions(store: Store, userId: string, now = new Date()): ContributionProfile {
  const { start, end } = contributionWindow(now)
  const startKey = start.toISOString().slice(0, 10)
  const endKey = end.toISOString().slice(0, 10)
  const events: Contribution[] = []

  for (const clone of store.clones) {
    if (clone.ownerId !== userId) continue
    const name = caseName(clone.caseId)
    const lineage = clone.lineage ?? "original"
    if (lineage === "cloned" || lineage === "original") {
      const from = lineage === "cloned" && clone.sourceOwnerName ? `Cloned from ${clone.sourceOwnerName}'s desk` : "Cloned from the public poster"
      events.push({
        id: `clone_${clone.id}`,
        at: clone.createdAt,
        day: dayKey(clone.createdAt),
        kind: "clone",
        title: `Private clone of ${name}`,
        detail: from,
        href: `/repository/${clone.id}`,
      })
    }

    for (const note of clone.milestones ?? []) {
      if (note.authorId !== userId || note.pullId || note.origin !== "room") continue
      events.push({
        id: `note_${note.id}`,
        at: note.createdAt,
        day: dayKey(note.createdAt),
        kind: "info",
        title: note.title,
        detail: `Added a note · ${name}`,
        href: `/repository/${clone.id}`,
      })
    }

    for (const item of clone.media ?? []) {
      if (item.pullId || item.createdAt < clone.createdAt) continue
      events.push({
        id: `media_${item.id}`,
        at: item.createdAt,
        day: dayKey(item.createdAt),
        kind: "info",
        title: item.title,
        detail: `Added ${article(item.kind)} · ${name}`,
        href: `/repository/${clone.id}`,
      })
    }

    for (const event of clone.hypothetical ?? []) {
      if (event.pullId || !event.createdAt) continue
      events.push({
        id: `hy_${event.id}`,
        at: event.createdAt,
        day: dayKey(event.createdAt),
        kind: "info",
        title: event.title,
        detail: `Added a hypothetical event · ${name}`,
        href: `/repository/${clone.id}`,
      })
    }
  }

  for (const pull of store.pulls ?? []) {
    if (pull.authorId !== userId) continue
    const name = caseName(pull.caseId)
    const kind =
      pull.kind === "note" ? "a note" : pull.kind === "hypothetical" ? "a hypothetical event" : article(pull.mediaKind || "file")
    events.push({
      id: `pull_${pull.id}`,
      at: pull.createdAt,
      day: dayKey(pull.createdAt),
      kind: "info",
      title: pull.title,
      detail: `Sent ${kind} · ${name}`,
      href: `/pulls/${pull.id}`,
    })
  }

  const inWindow = events
    .filter((event) => event.day >= startKey && event.day <= endKey)
    .sort((a, b) => b.at.localeCompare(a.at) || a.title.localeCompare(b.title))

  const counts = new Map<string, number>()
  for (const event of inWindow) counts.set(event.day, (counts.get(event.day) ?? 0) + 1)

  const weeks: ContributionDay[][] = []
  for (let column = 0; column < WEEKS; column += 1) {
    const days: ContributionDay[] = []
    for (let row = 0; row < 7; row += 1) {
      const date = addDays(start, column * 7 + row)
      const day = date.toISOString().slice(0, 10)
      days.push({ day, count: day > endKey ? 0 : counts.get(day) ?? 0, date })
    }
    weeks.push(days)
  }

  const monthLabels: { label: string; column: number }[] = []
  let lastColumn = -4
  for (let column = 0; column < weeks.length; column += 1) {
    const first = weeks[column].find((day) => day.date.getUTCDate() === 1 && day.day <= endKey)
    if (!first || column - lastColumn < 3) continue
    monthLabels.push({ label: MONTHS[first.date.getUTCMonth()], column })
    lastColumn = column
  }

  return {
    total: inWindow.length,
    clones: inWindow.filter((event) => event.kind === "clone").length,
    additions: inWindow.filter((event) => event.kind === "info").length,
    weeks,
    monthLabels,
    activity: inWindow,
    today: endKey,
  }
}

export function contributionLevel(count: number) {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count === 3) return 3
  return 4
}

export function formatContributionDay(day: string) {
  return utcDate(day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}
