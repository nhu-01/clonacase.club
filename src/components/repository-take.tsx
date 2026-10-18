"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cloneRepository, forkRepository } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function RepositoryTake({
  roomId,
  ownerName,
  cloneId,
  forkId,
}: {
  roomId: string
  ownerName: string
  cloneId: string | null
  forkId: string | null
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<"clone" | "fork" | null>(null)
  const [warn, setWarn] = useState(false)
  const [error, setError] = useState("")

  async function openDesk(kind: "clone" | "fork") {
    setError("")
    setWarn(false)
    setBusy(kind)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const started = performance.now()
    const label = kind === "fork" ? "Opening your fork" : "Opening your private copy"
    if (!reduce) window.dispatchEvent(new CustomEvent("clonacase:open", { detail: label }))
    const data = new FormData()
    data.set("roomId", roomId)
    const result = kind === "fork" ? await forkRepository(data) : await cloneRepository(data)
    if (!result?.roomId) {
      window.dispatchEvent(new Event("clonacase:cancel"))
      setBusy(null)
      setError(result?.error || "The repository did not save.")
      return
    }
    const wait = reduce ? 0 : Math.max(0, 780 - (performance.now() - started))
    await new Promise((resolve) => setTimeout(resolve, wait))
    router.push(`/repository/${result.roomId}`)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {cloneId ? (
        <Link
          href={`/repository/${cloneId}`}
          className="font-mono text-[10px] tracking-[0.14em] text-primary uppercase underline decoration-primary/40 underline-offset-4"
        >
          Your clone
        </Link>
      ) : (
        <Button
          type="button"
          disabled={busy !== null}
          className="h-8 px-3 text-xs transition-transform duration-300 hover:scale-[1.03]"
          onClick={() => void openDesk("clone")}
        >
          {busy === "clone" ? "Cloning…" : "Clone privately"}
        </Button>
      )}
      {forkId ? (
        <Link
          href={`/repository/${forkId}`}
          className="font-mono text-[10px] tracking-[0.14em] text-primary uppercase underline decoration-primary/40 underline-offset-4"
        >
          Your fork
        </Link>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={busy !== null}
          className="h-8 border-primary/40 px-3 text-xs transition-transform duration-300 hover:scale-[1.03]"
          onClick={() => setWarn(true)}
        >
          {busy === "fork" ? "Forking…" : "Fork"}
        </Button>
      )}
      <p className="max-w-56 text-left text-[11px] leading-4 text-muted-foreground sm:text-right">
        Clone stays private, tagged cloned from {ownerName}. A fork sends new notes to the original repository as a pull request.
      </p>
      {error ? <p className="max-w-56 text-right text-xs text-destructive">{error}</p> : null}

      <Dialog open={warn} onOpenChange={setWarn}>
        <DialogContent className="rounded-none border border-primary/40 bg-background text-foreground sm:max-w-md">
          <DialogHeader>
            <p className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">Fork</p>
            <DialogTitle className="font-heading text-3xl font-light">This fork sends pull requests.</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              Anything you add on this fork is submitted as a pull request to the original repository. It does not go on that repository until it is accepted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" className="h-9 border-primary/40 px-3" onClick={() => setWarn(false)}>
              Cancel
            </Button>
            <Button type="button" className="h-9 px-3" onClick={() => void openDesk("fork")}>
              Fork
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
