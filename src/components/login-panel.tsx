"use client"

import { useActionState } from "react"
import { login, signup } from "@/lib/actions"
import type { ActionState } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initial: ActionState = {}

function DemoDesk({
  name,
  email,
  nextPath,
}: {
  name: string
  email: string
  nextPath: string
}) {
  const [state, action, pending] = useActionState(login, initial)
  return (
    <form action={action} className="rounded-2xl border border-border/80 bg-card/60 p-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="password" value="watchlight" />
      <input type="hidden" name="next" value={nextPath} />
      <p className="font-heading text-2xl font-light">{name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{email}</p>
      {state.error ? <p className="mt-3 text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="mt-4 h-10 w-full">
        {pending ? "Opening…" : `Continue as ${name.split(" ")[0]}`}
      </Button>
    </form>
  )
}

export function LoginPanel({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(login, initial)
  const [created, create, creating] = useActionState(signup, initial)

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1fr_1fr] lg:py-24">
      <div>
        <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">Sign in</p>
        <h1 className="mt-4 font-heading text-5xl leading-none font-light tracking-tight sm:text-6xl">
          Two desks are already set.
        </h1>
        <p className="mt-6 max-w-md text-sm leading-6 text-muted-foreground">
          Ada keeps the sample link between Mara and Helen. Leif can confirm it. The password on
          both desks is <span className="text-foreground">watchlight</span>.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <DemoDesk name="Ada Voss" email="ada@clonacase.club" nextPath={nextPath} />
          <DemoDesk name="Leif Moran" email="leif@clonacase.club" nextPath={nextPath} />
        </div>
      </div>
      <div className="flex flex-col justify-end gap-10">
        <form action={action} className="grid gap-4">
          <input type="hidden" name="next" value={nextPath} />
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="username" className="h-10" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="h-10"
              required
            />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending} className="h-11">
            {pending ? "Checking…" : "Enter"}
          </Button>
        </form>
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground">
            Open your own desk
          </summary>
          <form action={create} className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" className="h-10" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-email">Email</Label>
              <Input id="new-email" name="email" type="email" className="h-10" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">Password</Label>
              <Input id="new-password" name="password" type="password" minLength={8} className="h-10" required />
            </div>
            {created.error ? <p className="text-sm text-destructive">{created.error}</p> : null}
            <Button type="submit" variant="outline" disabled={creating} className="h-11">
              {creating ? "Setting the desk…" : "Create a desk"}
            </Button>
          </form>
        </details>
      </div>
    </div>
  )
}
