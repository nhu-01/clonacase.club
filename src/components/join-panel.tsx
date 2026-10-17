"use client"

import Link from "next/link"
import { useActionState } from "react"
import { signup } from "@/lib/actions"
import type { ActionState } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initial: ActionState = {}

export function JoinPanel({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(signup, initial)

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-16">
      <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">First visit</p>
      <h1 className="mt-4 font-heading text-5xl leading-none font-light tracking-tight">
        Choose an anonymous username.
      </h1>
      <p className="mt-5 text-sm leading-6 text-muted-foreground">
        The timeline opens after this. The name is what other people see on a thread or a public
        repository.
      </p>
      <form action={action} className="mt-8 grid gap-4">
        <input type="hidden" name="next" value={nextPath} />
        <div className="grid gap-2">
          <Label htmlFor="name">Anonymous username</Label>
          <Input id="name" name="name" autoComplete="nickname" className="h-10" required minLength={3} maxLength={20} />
          <p className="text-xs leading-5 text-muted-foreground">
            Do not use your real name. Letters, numbers, and hyphens only.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" className="h-10" required />
          <p className="text-xs leading-5 text-muted-foreground">The email stays off the public pages.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} className="h-10" required />
        </div>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="h-11">
          {pending ? "Opening the timeline…" : "Create the username"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Already have a username?{" "}
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="text-foreground underline decoration-primary/40 underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  )
}
