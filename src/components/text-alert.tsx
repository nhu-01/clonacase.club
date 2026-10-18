"use client"

import { useActionState } from "react"
import { followByText, stopText } from "@/lib/actions"
import { formatPhone } from "@/lib/format"
import type { ActionState } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initial: ActionState = {}

export function TextAlert({
  kind,
  targetId,
  line,
  phone,
  watching,
}: {
  kind: "case" | "repository"
  targetId: string
  line: string
  phone: string
  watching: boolean
}) {
  const [state, follow, pending] = useActionState(followByText, initial)
  const [stopped, stop, stopping] = useActionState(stopText, initial)
  const headline = kind === "case" ? "Text this case" : "Text this repository"
  const shown = formatPhone(line)

  return (
    <section className="mt-10 border border-border/80 bg-card/40 px-5 py-5">
      <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">Photon</p>
      <h2 className="mt-2 font-heading text-3xl font-light">{headline}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {shown ? (
          <>
            iMessage <span className="text-foreground">{shown}</span>. Subscribing sends a confirmation in that chat. This number cannot text you first.
          </>
        ) : (
          "The iMessage line is not connected yet."
        )}
      </p>
      {watching ? (
        <div className="mt-5 flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Following <span className="text-foreground">{formatPhone(phone)}</span>
          </p>
          <form action={stop}>
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="targetId" value={targetId} />
            <Button type="submit" variant="outline" disabled={stopping} className="h-10">
              {stopping ? "Stopping…" : "Stop texts"}
            </Button>
          </form>
        </div>
      ) : (
        <form action={follow} className="mt-5 grid max-w-lg gap-3">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="targetId" value={targetId} />
          <div className="grid gap-2">
            <Label htmlFor={`${kind}-phone`}>Your iMessage</Label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input id={`${kind}-phone`} name="phone" autoComplete="tel" defaultValue={phone} placeholder="+1 206 555 0100" className="h-10 sm:flex-1" required />
              <Button type="submit" disabled={pending} className="h-10 sm:px-5">
                {pending ? "Saving…" : "Follow"}
              </Button>
            </div>
          </div>
        </form>
      )}
      {state.error ? <p className="mt-3 text-sm text-destructive">{state.error}</p> : null}
      {state.note ? <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{state.note}</p> : null}
      {stopped.error ? <p className="mt-3 text-sm text-destructive">{stopped.error}</p> : null}
      {stopped.note ? <p className="mt-3 text-sm text-muted-foreground">{stopped.note}</p> : null}
    </section>
  )
}
