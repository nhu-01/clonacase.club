"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { WashingtonDossier } from "@/components/washington-dossier"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { washingtonRecords, type WashingtonRecord } from "@/lib/washington-public"

export type LandingFile = {
  id: string
  name: string
  age: number
  city: string
  region: string
}

const RESULT_CAP = 8

function Flashlight() {
  const beam = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = beam.current
    if (!node) return
    const paint = (x: number, y: number) => {
      node.style.background = `radial-gradient(560px circle at ${x}px ${y}px, oklch(0.34 0.13 22 / 0.62), oklch(0.2 0.07 18 / 0.18) 40%, transparent 70%)`
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

function matchesFile(file: LandingFile, needle: string) {
  if (digitsOnly(needle)) return String(file.age) === needle
  if (needle.length < 3) return nameStarts(file.name, needle)
  const place = `${file.city}, ${file.region}`.toLowerCase()
  return (
    file.name.toLowerCase().includes(needle) ||
    file.city.toLowerCase().includes(needle) ||
    file.region.toLowerCase().includes(needle) ||
    place.includes(needle)
  )
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

export function Landing({ signedIn, files }: { signedIn: boolean; files: LandingFile[] }) {
  const [query, setQuery] = useState("")
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [pickedQuery, setPickedQuery] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.dataset.landing = "true"
    return () => {
      delete document.documentElement.dataset.landing
    }
  }, [])

  const needle = query.trim().toLowerCase()

  const washington = useMemo(
    () => (needle ? washingtonRecords.filter((record) => matchesRecord(record, needle)) : []),
    [needle],
  )
  const fictional = useMemo(
    () => (needle ? files.filter((file) => matchesFile(file, needle)) : []),
    [files, needle],
  )

  const selectedId =
    pickedQuery === needle ? pickedId : washington.length === 1 ? washington[0].id : null

  function selectRecord(id: string | null) {
    setPickedQuery(needle)
    setPickedId(id)
  }

  const selected = washington.find((record) => record.id === selectedId) ?? null
  const shownWashington = washington.slice(0, RESULT_CAP)
  const searching = needle.length > 0
  const nothing = searching && washington.length === 0 && fictional.length === 0

  return (
    <div
      className={`relative z-10 mx-auto flex min-h-[calc(100vh-3.5rem)] w-full flex-col px-5 py-16 ${
        searching ? "max-w-5xl justify-start" : "max-w-3xl justify-center"
      }`}
    >
      <Flashlight />
      <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">Public record</p>
      <h1 className="rise mt-5 font-heading text-[clamp(3.2rem,8vw,6rem)] leading-[0.9] font-light tracking-[-0.035em]">
        A quiet room
        <span className="block italic text-primary">for a public case.</span>
      </h1>
      <p className="rise mt-6 max-w-xl text-sm leading-6 text-muted-foreground" style={{ animationDelay: "0.08s" }}>
        Search a name, an age, or a place. Washington names are adult public posters from the Washington
        State Patrol. The demonstration files are fictional.
      </p>
      <form className="rise mt-10" style={{ animationDelay: "0.14s" }} onSubmit={(event) => event.preventDefault()}>
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
        {nothing ? <p className="text-sm text-muted-foreground">Nothing in the archive matches that.</p> : null}

        {shownWashington.length > 0 ? (
          <section>
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              Washington State Patrol
              {washington.length > shownWashington.length
                ? ` · ${shownWashington.length} of ${washington.length}`
                : ` · ${washington.length}`}
            </p>
            <ul className="mt-2 divide-y divide-primary/20 border-y border-primary/25">
              {shownWashington.map((record) => {
                const open = record.id === selectedId
                return (
                  <li key={record.id}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => selectRecord(open ? null : record.id)}
                      className={`group block w-full py-4 text-left ${open ? "border-l-2 border-primary pl-4" : ""}`}
                    >
                      <span className="block font-heading text-3xl font-light tracking-tight transition-colors group-hover:text-primary">
                        {record.name}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {record.age} on the poster
                        {record.place ? ` · ${record.place}` : ""}
                        {record.lastSeen ? ` · last seen ${record.lastSeen}` : ""}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {washington.length > shownWashington.length ? (
              <p className="mt-3 text-xs text-muted-foreground">Add another word to narrow the posters.</p>
            ) : null}
          </section>
        ) : null}

        {selected ? <WashingtonDossier key={selected.id} record={selected} /> : null}

        {fictional.length > 0 ? (
          <section className={shownWashington.length > 0 ? "mt-10" : ""}>
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Fictional files</p>
            <ul className="mt-2 divide-y divide-primary/20 border-y border-primary/25">
              {fictional.map((file) => (
                <li key={file.id}>
                  <Link href={`/cases/${file.id}`} className="group block py-4">
                    <span className="block font-heading text-3xl font-light tracking-tight transition-colors group-hover:text-primary">
                      {file.name}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {file.age} · {file.city}, {file.region}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
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
          {signedIn ? "Your rooms" : "Sign in"}
        </Button>
      </div>
    </div>
  )
}
