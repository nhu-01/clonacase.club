"use client"

import { useActionState } from "react"
import { acceptPull, declinePull } from "@/lib/actions"
import type { ActionState } from "@/lib/types"
import { Button } from "@/components/ui/button"

const initial: ActionState = {}

export function PullDecision({ id }: { id: string }) {
  const [accepted, accept, accepting] = useActionState(acceptPull, initial)
  const [declined, decline, declining] = useActionState(declinePull, initial)
  const error = accepted.error || declined.error

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <form action={accept}>
        <input type="hidden" name="pullId" value={id} />
        <Button type="submit" disabled={accepting || declining} className="h-8 px-3 text-xs">
          {accepting ? "Accepting…" : "Accept"}
        </Button>
      </form>
      <form action={decline}>
        <input type="hidden" name="pullId" value={id} />
        <Button type="submit" variant="outline" disabled={accepting || declining} className="h-8 border-primary/40 px-3 text-xs">
          {declining ? "Declining…" : "Decline"}
        </Button>
      </form>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
