"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { washingtonRecords, type WashingtonRecord } from "@/lib/washington-public"

const RESULT_CAP = 8

function Flashlight() {
  const beam = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = beam.current
    if (!node) return
    const paint = (x: number, y: number) => {
      node.style.background = `radial-gradient(560px circle at ${x}px ${y}px, oklch(0.26 0.11 24 / 0.7), oklch(0.14 0.06 20 / 0.2) 40%, transparent 70%)`
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduced.matches) {
      paint(window.innerWidth * 0.72, 160)
      return
    }
    paint(window.innerWidth * 0.62, 180)
    const onMove = (event: PointerEvent) => paint(event.clientX, event.clientY)
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [])

  return <div ref={beam} className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
}

function digitsOnly(value: string) {
  return /^\d+$/.test(value)
}

function nameStarts(name: string, needle: string) {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .some((word) => word.startsWith(needle))
}

function matchesRecord(record: WashingtonRecord, needle: string) {
  if (digitsOnly(needle)) {
    if (needle.length === 4) {
      return Boolean(record.lastSeenIso?.startsWith(needle) || record.published.startsWith(needle))
    }
    return String(record.age) === needle
  }
  if (needle.length < 3) return nameStarts(record.name, needle)
  const blob = [record.name, record.place, record.agency, record.summary].filter(Boolean).join(" ").toLowerCase()
  return blob.includes(needle)
}

export function Landing({ signedIn }: { signedIn: boolean }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const needle = query.trim().toLowerCase()

  const matches = useMemo(
    () => (needle ? washingtonRecords.filter((record) => matchesRecord(record, needle)) : []),
    [needle],
  )
  const shown = matches.slice(0, RESULT_CAP)
  const searching = needle.length > 0

  function openRecord(record: WashingtonRecord) {
    router.push(`/records/${record.id}`)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const exact = matches.find((record) => record.name.toLowerCase() === needle)
    const target = exact ?? (matches.length === 1 ? matches[0] : null)
    if (target) openRecord(target)
  }

  return (
    <div
      className={`relative z-10 mx-auto flex min-h-[calc(100vh-3.5rem)] w-full flex-col px-5 py-16 ${
        searching ? "max-w-3xl justify-start" : "max-w-3xl justify-center"
      }`}
    >
      <Flashlight />
      <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">Public record</p>
      <h1 className="rise mt-5 font-heading text-[clamp(2.7rem,7vw,5.4rem)] leading-[0.95] font-light tracking-[-0.035em]">
        Clone the Case,
        <span className="block italic text-primary">Find the Trace</span>
      </h1>
      <p className="rise mt-6 max-w-xl text-sm leading-6 text-muted-foreground" style={{ animationDelay: "0.08s" }}>
        Search a name, an age, or a place. The first time you open a person, choose an anonymous username.
        The timeline is the next page. A clone of the case starts private.
      </p>
      <form className="rise mt-10" style={{ animationDelay: "0.14s" }} onSubmit={onSubmit}>
        <label htmlFor="archive-search" className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Name, age, location
        </label>
        <Input
          id="archive-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rachael, 40, Moscow"
          autoComplete="off"
          className="mt-3 h-12 rounded-none border-x-0 border-t-0 border-b border-primary/50 bg-transparent px-0 text-base shadow-none focus-visible:border-primary focus-visible:ring-0 md:text-base"
        />
      </form>

      {searching ? <div className="spine-x mt-6 h-px bg-primary/80" /> : null}

      <div className="mt-6">
        {searching && matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing in the archive matches that.</p>
        ) : null}

        {shown.length > 0 ? (
          <section>
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              Washington State Patrol
              {matches.length > shown.length ? ` · ${shown.length} of ${matches.length}` : ` · ${matches.length}`}
            </p>
            <ul className="mt-2 divide-y divide-primary/20 border-y border-primary/25">
              {shown.map((record) => (
                <li key={record.id}>
                  <Link href={`/records/${record.id}`} className="group block py-4">
                    <span className="block font-heading text-3xl font-light tracking-tight transition-colors group-hover:text-primary">
                      {record.name}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {record.age} on the poster
                      {record.place ? ` · ${record.place}` : ""}
                      {record.lastSeen ? ` · last seen ${record.lastSeen}` : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {matches.length > shown.length ? (
              <p className="mt-3 text-xs text-muted-foreground">Add another word to narrow the posters.</p>
            ) : null}
          </section>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button render={<Link href="/archive" />} className="h-11 px-5" nativeButton={false}>
          Enter the archive
        </Button>
        <Button
          variant="outline"
          render={<Link href={signedIn ? "/rooms" : "/login"} />}
          className="h-11 border-primary/40 px-5"
          nativeButton={false}
        >
          {signedIn ? "Your repository" : "Sign in"}
        </Button>
      </div>
    </div>
  )
}
