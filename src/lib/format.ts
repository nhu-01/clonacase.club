import type { ConnectionType, MilestoneKind } from "@/lib/types"

export function formatDay(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  if (!year || !month || !day) return iso
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function formatDayLong(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  if (!year || !month || !day) return iso
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function formatWhen(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function daysBetween(earlier: string, later: string) {
  const a = Date.parse(`${earlier.slice(0, 10)}T00:00:00Z`)
  const b = Date.parse(`${later.slice(0, 10)}T00:00:00Z`)
  return Math.round((b - a) / 86_400_000)
}

export function kindLabel(kind: MilestoneKind) {
  if (kind === "sourced") return "Sourced"
  if (kind === "lead") return "Lead"
  return "Inconclusive"
}

export function connectionLabel(type: ConnectionType) {
  switch (type) {
    case "shared-associate":
      return "Shared public associate"
    case "overlapping-dates":
      return "Overlapping dates"
    case "shared-route":
      return "Shared route"
    case "same-city":
      return "Same city"
  }
}

export function safeNext(value: unknown) {
  if (typeof value !== "string") return "/archive"
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) {
    return "/archive"
  }
  return value
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

export function isInternalPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//")
}
