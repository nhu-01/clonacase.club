"use client"

import { useActionState } from "react"
import { followByText, stopText } from "@/lib/actions"
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
  const detail = line
    ? `Message ${line} once, from the number you put here. A shared line cannot text you first.`
    : "The line is not connected yet. A number saved here starts when it is."

  return (
    <section className="mt-10 border border-border/80 bg-card/40 px-5 py-5">
      <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">Photon</p>
      <h2 className="mt-2 font-heading text-3xl font-light">{headline}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{detail}</p>
      {watching ? (
        <form action={stop} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="targetId" value={targetId} />
          <p className="text-sm text-foreground">Following from {phone}.</p>
          <Button type="submit" variant="outline" disabled={stopping} className="h-10">
            {stopping ? "Stopping…" : "Stop texts"}
          </Button>
        </form>
      ) : (
        <form action={follow} className="mt-4 grid max-w-md gap-3">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="targetId" value={targetId} />
          <div className="grid gap-2">
            <Label htmlFor={`${kind}-phone`}>Phone or iMessage email</Label>
            <Input id={`${kind}-phone`} name="phone" autoComplete="tel" defaultValue={phone} className="h-10" required />
          </div>
          <Button type="submit" disabled={pending} className="h-10">
            {pending ? "Saving…" : "Follow by text"}
          </Button>
        </form>
      )}
      {state.error ? <p className="mt-3 text-sm text-destructive">{state.error}</p> : null}
      {state.note ? <p className="mt-3 text-sm text-foreground">{state.note}</p> : null}
      {stopped.note ? <p className="mt-3 text-sm text-foreground">{stopped.note}</p> : null}
      {stopped.error ? <p className="mt-3 text-sm text-destructive">{stopped.error}</p> : null}
    </section>
  )
}
