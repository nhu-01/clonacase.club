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

export function formatPhone(value: string) {
  if (value.includes("@")) return value
  const digits = value.replace(/\D/g, "")
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return value
}

export function formatClock(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return ""
  const hour = Number(match[1])
  const minute = match[2]
  if (hour > 23) return ""
  const suffix = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12
  return `${hour12}:${minute} ${suffix}`
}

export function formatStamp(date: string, time?: string) {
  const day = formatDay(date)
  const clock = time ? formatClock(time) : ""
  return clock ? `${day} · ${clock}` : day
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
  if (typeof value !== "string") return "/cases"
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) {
    return "/cases"
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
