"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

const NAMES = [
  { name: "Mara Ellison", place: "Portland · 12 Mar 2024" },
  { name: "Jonah Reed", place: "Sacramento · 18 Mar 2024" },
  { name: "Helen Cho", place: "Oakland · 9 Mar 2024" },
]

export function Landing({ signedIn }: { signedIn: boolean }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (motion.matches) return
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % NAMES.length), 2800)
    return () => window.clearInterval(timer)
  }, [])

  const shown = [NAMES[index]]

  return (
    <div className="relative mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-6xl items-end gap-16 px-5 py-16 lg:grid-cols-[1.4fr_0.8fr] lg:items-center lg:py-24">
      <div
        className="ember pointer-events-none absolute top-10 right-0 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        aria-hidden="true"
      />
      <div>
        <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">
          Demonstration archive
        </p>
        <h1 className="rise mt-5 max-w-3xl font-heading text-[clamp(3.4rem,8vw,6.6rem)] leading-[0.9] font-light tracking-[-0.035em] text-foreground">
          A quiet room
          <span className="block italic text-primary">for a public case.</span>
        </h1>
        <p className="rise mt-8 max-w-xl text-base leading-7 text-muted-foreground" style={{ animationDelay: "0.12s" }}>
          Open a file, clone it, and keep a timeline where every note is sourced, a lead, or
          inconclusive. Link two cases only as a claim with a source. The draft brief cites the
          room and stops there.
        </p>
        <div className="rise mt-10 flex flex-wrap items-center gap-3" style={{ animationDelay: "0.2s" }}>
          <Button
            render={<Link href="/archive" />}
            className="h-11 px-5"
            nativeButton={false}
          >
            Enter the archive
          </Button>
          <Button
            variant="outline"
            render={<Link href={signedIn ? "/rooms" : "/login"} />}
            className="h-11 px-5"
            nativeButton={false}
          >
            {signedIn ? "Your rooms" : "Sign in"}
          </Button>
        </div>
      </div>
      <div className="border-l border-border/80 pl-6">
        <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Open files</p>
        <div className="mt-6 min-h-28">
          {shown.map((item) => (
            <div key={item.name} className="rise">
              <p className="font-heading text-4xl font-light italic">{item.name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.place}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-xs text-xs leading-5 text-muted-foreground">
          These three people are fictional. Hearth does not search the web, scrape accounts, or
          name a suspect.
        </p>
      </div>
    </div>
  )
}
