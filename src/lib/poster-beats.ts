import { washingtonSource, type WashingtonRecord } from "@/lib/washington-public"

export type PosterBeat = {
  kind: string
  sort: string
  label: string
  title: string
  body: string
  href: string
  source: string
}

export function posterBeats(record: WashingtonRecord): PosterBeat[] {
  const items: PosterBeat[] = []
  if (record.lastSeen || record.summary) {
    items.push({
      kind: "last_seen",
      sort: record.lastSeenIso ?? `${record.published}-01`,
      label: record.lastSeen ?? "On the poster",
      title: record.lastSeen ? "Last seen" : "What the poster says",
      body: record.summary,
      href: record.poster,
      source: "Official poster",
    })
  }
  items.push({
    kind: "poster_published",
    sort: `${record.published}-01`,
    label: record.publishedLabel,
    title: "Poster published",
    body: "Washington State Patrol published this poster. The age is the age printed on it, from when the person was reported missing.",
    href: record.poster,
    source: "Official poster",
  })
  items.push({
    kind: "state_listing",
    sort: "9999-01-01",
    label: "Public page",
    title: "Listed by the Washington State Patrol",
    body: "The poster is on the state missing-persons page. A photograph appears when the family or the investigating agency asked for one.",
    href: washingtonSource,
    source: "Washington State Patrol",
  })
  return items.sort((a, b) => a.sort.localeCompare(b.sort) || a.kind.localeCompare(b.kind))
}
