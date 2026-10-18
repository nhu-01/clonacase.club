"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { washingtonRecords, type WashingtonRecord } from "@/lib/washington-public"

function tokenMatches(record: WashingtonRecord, token: string) {
  if (/^\d+$/.test(token)) {
    if (token.length === 4) {
      return Boolean(record.lastSeenIso?.startsWith(token) || record.published.startsWith(token))
    }
    return String(record.age) === token
  }
  if (token.length < 3) {
    return record.name
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .some((word) => word.startsWith(token))
  }
  const blob = [record.name, record.place, record.agency, record.summary, record.lastSeen]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return blob.includes(token)
}

function matches(record: WashingtonRecord, query: string) {
  const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  return tokens.every((token) => tokenMatches(record, token))
}

export function CaseIndex() {
  const [query, setQuery] = useState("")
  const needle = query.trim()
  const shown = useMemo(
    () => (needle ? washingtonRecords.filter((record) => matches(record, needle)) : washingtonRecords),
    [needle],
  )

  return (
    <>
      <form className="mt-10 max-w-xl" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="case-search" className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Name, age, location
        </label>
        <Input
          id="case-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rachael, 40, Moscow"
          autoComplete="off"
          className="mt-3 h-12 rounded-none border-x-0 border-t-0 border-b border-primary/50 bg-transparent px-0 text-base shadow-none focus-visible:border-primary focus-visible:ring-0 md:text-base"
        />
        <p className="mt-3 text-xs text-muted-foreground">
          {shown.length === washingtonRecords.length
            ? `${washingtonRecords.length} cases`
            : `${shown.length} of ${washingtonRecords.length} cases`}
        </p>
      </form>

      {shown.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No case matches that.</p>
      ) : (
        <div className="mt-8 divide-y divide-primary/20 border-y border-primary/25">
          {shown.map((record) => (
            <Link
              key={record.id}
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
          ))}
        </div>
      )}
    </>
  )
}
