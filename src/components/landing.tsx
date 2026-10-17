"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export type LandingFile = {
  id: string
  name: string
  age: number
  city: string
  region: string
}

function Flashlight() {
  const beam = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = beam.current
    if (!node) return
    const paint = (x: number, y: number) => {
      node.style.background = `radial-gradient(540px circle at ${x}px ${y}px, oklch(0.64 0.09 22 / 0.38), oklch(0.4 0.05 22 / 0.1) 36%, transparent 68%)`
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

export function Landing({ signedIn, files }: { signedIn: boolean; files: LandingFile[] }) {
  const [query, setQuery] = useState("")

  useEffect(() => {
    document.documentElement.dataset.landing = "true"
    return () => {
      delete document.documentElement.dataset.landing
    }
  }, [])

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    return files.filter((file) => {
      const place = `${file.city}, ${file.region}`.toLowerCase()
      return (
        file.name.toLowerCase().includes(needle) ||
        String(file.age).includes(needle) ||
        file.city.toLowerCase().includes(needle) ||
        file.region.toLowerCase().includes(needle) ||
        place.includes(needle)
      )
    })
  }, [files, query])

  return (
    <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-3xl flex-col justify-center px-5 py-16">
      <Flashlight />
      <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">Demonstration archive</p>
      <h1 className="rise mt-5 font-heading text-[clamp(3.2rem,8vw,6rem)] leading-[0.9] font-light tracking-[-0.035em]">
        A quiet room
        <span className="block italic text-primary">for a public case.</span>
      </h1>
      <p className="rise mt-6 max-w-xl text-sm leading-6 text-muted-foreground" style={{ animationDelay: "0.08s" }}>
        Search a name, an age, or a place. The files below are fictional. clonacase does not search
        the web, scrape accounts, or name a suspect.
      </p>
      <form className="rise mt-10" style={{ animationDelay: "0.14s" }} onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="archive-search" className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Name, age, location
        </label>
        <Input
          id="archive-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Mara, 34, Portland"
          autoComplete="off"
          className="mt-3 h-12 rounded-none border-x-0 border-t-0 border-b border-primary/40 bg-transparent px-0 text-base shadow-none focus-visible:border-primary focus-visible:ring-0 md:text-base"
        />
      </form>
      <div className="mt-8 min-h-28">
        {query.trim() && matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing in the archive matches that.</p>
        ) : null}
        {matches.length > 0 ? (
          <ul className="divide-y divide-border/80 border-y border-border/80">
            {matches.map((file) => (
              <li key={file.id}>
                <Link href={`/cases/${file.id}`} className="group block py-5">
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
        ) : null}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button render={<Link href="/archive" />} className="h-11 px-5" nativeButton={false}>
          Enter the archive
        </Button>
        <Button
          variant="outline"
          render={<Link href={signedIn ? "/rooms" : "/login"} />}
          className="h-11 border-primary/30 px-5"
          nativeButton={false}
        >
          {signedIn ? "Your rooms" : "Sign in"}
        </Button>
      </div>
    </div>
  )
}
