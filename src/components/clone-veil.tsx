"use client"

import { useEffect, useState } from "react"

type Phase = "idle" | "open" | "leave"

export function CloneVeil() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [line, setLine] = useState("Opening your repository")

  useEffect(() => {
    const open = (event: Event) => {
      const detail = event instanceof CustomEvent && typeof event.detail === "string" ? event.detail : ""
      setLine(detail || "Opening your repository")
      setPhase("open")
    }
    const cancel = () => setPhase("idle")
    const arrive = () => setPhase((current) => (current === "open" ? "leave" : current))
    window.addEventListener("clonacase:open", open)
    window.addEventListener("clonacase:cancel", cancel)
    window.addEventListener("clonacase:arrive", arrive)
    return () => {
      window.removeEventListener("clonacase:open", open)
      window.removeEventListener("clonacase:cancel", cancel)
      window.removeEventListener("clonacase:arrive", arrive)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("clone-opening", phase === "open")
    return () => document.documentElement.classList.remove("clone-opening")
  }, [phase])

  useEffect(() => {
    if (phase !== "leave") return
    const id = window.setTimeout(() => setPhase("idle"), 680)
    return () => window.clearTimeout(id)
  }, [phase])

  if (phase === "idle") return null

  return (
    <div className={phase === "leave" ? "clone-veil clone-veil-out" : "clone-veil"} role="status">
      <p className="font-heading text-4xl font-light text-foreground">{line}</p>
    </div>
  )
}

export function RepositoryArrive() {
  useEffect(() => {
    window.dispatchEvent(new Event("clonacase:arrive"))
  }, [])
  return null
}
