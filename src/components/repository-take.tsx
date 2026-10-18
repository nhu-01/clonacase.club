"use client"

import Link from "next/link"
import { useActionState } from "react"
import { cloneRepository, forkRepository } from "@/lib/actions"
import type { ActionState } from "@/lib/types"
import { Button } from "@/components/ui/button"

const initial: ActionState = {}

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
  const [cloned, clone, cloning] = useActionState(cloneRepository, initial)
  const [forked, fork, forking] = useActionState(forkRepository, initial)

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
        <form action={clone}>
          <input type="hidden" name="roomId" value={roomId} />
          <Button type="submit" disabled={cloning} className="h-8 px-3 text-xs">
            {cloning ? "Cloning…" : "Clone privately"}
          </Button>
        </form>
      )}
      {forkId ? (
        <Link
          href={`/repository/${forkId}`}
          className="font-mono text-[10px] tracking-[0.14em] text-primary uppercase underline decoration-primary/40 underline-offset-4"
        >
          Your fork
        </Link>
      ) : (
        <form action={fork}>
          <input type="hidden" name="roomId" value={roomId} />
          <Button type="submit" variant="outline" disabled={forking} className="h-8 border-primary/40 px-3 text-xs">
            {forking ? "Forking…" : "Fork"}
          </Button>
        </form>
      )}
      <p className="max-w-56 text-left text-[11px] leading-4 text-muted-foreground sm:text-right">
        Clone stays private, tagged cloned from {ownerName}. A fork sends new notes back as a pull request.
      </p>
      {cloned.error ? <p className="max-w-44 text-right text-xs text-destructive">{cloned.error}</p> : null}
      {forked.error ? <p className="max-w-44 text-right text-xs text-destructive">{forked.error}</p> : null}
    </div>
  )
}
