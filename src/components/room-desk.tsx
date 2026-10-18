"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  addConnection,
  addMilestone,
  confirmConnection,
  pinMessage,
  postMessage,
  setVisibility,
  writeBrief,
} from "@/lib/actions"
import { connectionLabel, formatWhen, kindLabel } from "@/lib/format"
import type { ActionState, ConnectionType, MilestoneKind, PublicUser, RoomView } from "@/lib/types"
import { CaseMap, type MapLine, type MapPin } from "@/components/case-map"
import { Timeline } from "@/components/timeline"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

const initial: ActionState = {}
const kinds: MilestoneKind[] = ["sourced", "lead", "inconclusive"]
const linkTypes: ConnectionType[] = [
  "shared-associate",
  "overlapping-dates",
  "shared-route",
  "same-city",
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function KindField({ defaultKind = "lead" }: { defaultKind?: MilestoneKind }) {
  return (
    <div className="flex flex-wrap gap-2">
      {kinds.map((kind) => (
        <label
          key={kind}
          className="cursor-pointer rounded-full border border-border px-3 py-1 text-[11px] tracking-[0.14em] text-muted-foreground uppercase transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
        >
          <input
            type="radio"
            name="kind"
            value={kind}
            defaultChecked={kind === defaultKind}
            className="sr-only"
          />
          {kindLabel(kind)}
        </label>
      ))}
    </div>
  )
}

function Composer({ roomId }: { roomId: string }) {
  const [state, action, pending] = useActionState(addMilestone, initial)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={action} className="mt-8 grid gap-4 rounded-2xl border border-dashed border-border p-4">
      <input type="hidden" name="roomId" value={roomId} />
      <div>
        <p className="font-heading text-2xl font-light">Add a milestone</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Sourced notes need a source. Leads and inconclusive notes stay labeled.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" required className="h-10" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required className="h-10" placeholder="What happened" />
        </div>
      </div>
      <KindField />
      <div className="grid gap-2">
        <Label htmlFor="body">Note</Label>
        <Textarea id="body" name="body" placeholder="What the source actually says" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="sourceLabel">Source</Label>
          <Input id="sourceLabel" name="sourceLabel" className="h-10" placeholder="Who published this" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sourceUrl">Source link</Label>
          <Input id="sourceUrl" name="sourceUrl" className="h-10" placeholder="https:// or /page" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="imageUrl">Image link</Label>
        <Input id="imageUrl" name="imageUrl" className="h-10" placeholder="Optional https image" />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="h-10 w-fit px-4">
        {pending ? "Saving…" : "Place on the timeline"}
      </Button>
    </form>
  )
}

function PinForm({ roomId, messageId, body }: { roomId: string; messageId: string; body: string }) {
  const [state, action, pending] = useActionState(pinMessage, initial)
  const [open, setOpen] = useState(false)
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-primary hover:underline">
        Pin to the timeline
      </button>
    )
  }
  return (
    <form action={action} className="mt-3 grid gap-3 border-t border-border/80 pt-3">
      <input type="hidden" name="roomId" value={roomId} />
      <input type="hidden" name="messageId" value={messageId} />
      <KindField />
      <Input name="title" defaultValue={body.slice(0, 80)} className="h-9" required />
      <Input name="date" type="date" defaultValue={today()} className="h-9" required />
      <Input name="sourceLabel" placeholder="Source, if you have one" className="h-9" />
      <Input name="sourceUrl" placeholder="Source link" className="h-9" />
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      <Button type="submit" size="sm" disabled={pending} className="w-fit">
        {pending ? "Pinning…" : "Pin as a milestone"}
      </Button>
    </form>
  )
}

function VisibilityControl({ room }: { room: RoomView }) {
  const [state, action, pending] = useActionState(setVisibility, initial)
  const missing = room.milestones.filter((item) => item.kind === "sourced" && !item.sourceLabel.trim())
  const isPublic = room.clone.visibility === "public"
  return (
    <Dialog>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline" }), "h-9 px-3")}>
        {isPublic ? "Public room" : "Share room"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-light">
            {isPublic ? "This room is public" : "Share this room"}
          </DialogTitle>
          <DialogDescription>
            {isPublic
              ? "Signed-in volunteers can read it and add notes. The original file stays as it was."
              : "Public means any signed-in volunteer can read this clone. The case file does not change."}
          </DialogDescription>
        </DialogHeader>
        {!isPublic ? (
          <ul className="grid gap-2 text-sm">
            <li className={missing.length ? "text-destructive" : "text-sourced"}>
              {missing.length
                ? `Still need a source: ${missing.map((item) => item.title).join(", ")}`
                : "Every sourced milestone names its source."}
            </li>
            <li className="text-sourced">Leads and inconclusive notes stay labeled.</li>
          </ul>
        ) : null}
        <form action={action} className="grid gap-3">
          <input type="hidden" name="roomId" value={room.clone.id} />
          {isPublic ? (
            <input type="hidden" name="visibility" value="private" />
          ) : (
            <>
              <input type="hidden" name="visibility" value="public" />
              <label className="flex items-start gap-2 text-sm leading-5">
                <input type="checkbox" name="acknowledge" value="yes" className="mt-1" />
                This room names no suspect. Links stay claims until someone else confirms them.
              </label>
            </>
          )}
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending || (!isPublic && missing.length > 0)} className="h-10">
            {pending ? "Saving…" : isPublic ? "Make private" : "Make public"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function BriefPanel({ room }: { room: RoomView }) {
  const [state, action, pending] = useActionState(writeBrief, initial)
  const brief = room.brief
  return (
    <div className="grid gap-4">
      <form action={action}>
        <input type="hidden" name="roomId" value={room.clone.id} />
        <Button type="submit" disabled={pending || !room.canEdit} className="h-10 px-4">
          {pending ? "Reading the timeline…" : brief ? "Draft again" : "Draft the brief"}
        </Button>
      </form>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {!brief ? (
        <p className="text-sm leading-6 text-muted-foreground">
          The draft has not been written. It will only use milestones already on this timeline.
        </p>
      ) : (
        <article className="grid gap-4 text-sm leading-6">
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            Draft · {formatWhen(brief.generatedAt)}
          </p>
          <p>{brief.narrative}</p>
          {brief.narrativeIds.length > 0 ? (
            <p className="flex flex-wrap gap-2">
              {brief.narrativeIds.map((id) => (
                <a key={id} href={`#${id}`} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground">
                  {room.milestones.find((item) => item.id === id)?.title ?? id}
                </a>
              ))}
            </p>
          ) : null}
          {brief.gaps.length > 0 ? (
            <div>
              <p className="font-mono text-[10px] tracking-[0.16em] text-lead uppercase">Gaps</p>
              <ul className="mt-2 grid gap-2">
                {brief.gaps.map((gap) => (
                  <li key={gap.text}>{gap.text}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground">No gap of ten days or more between sourced events.</p>
          )}
          {brief.unresolved.length > 0 ? (
            <div>
              <p className="font-mono text-[10px] tracking-[0.16em] text-inconclusive uppercase">Inconclusive</p>
              <ul className="mt-2 grid gap-2">
                {brief.unresolved.map((item) => (
                  <li key={item.id}>{item.text}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {brief.leads.length > 0 ? (
            <div>
              <p className="font-mono text-[10px] tracking-[0.16em] text-lead uppercase">Leads</p>
              <ul className="mt-2 grid gap-2">
                {brief.leads.map((item) => (
                  <li key={item.id}>{item.text}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="text-muted-foreground">{brief.closing}</p>
        </article>
      )}
    </div>
  )
}

function Notes({ room, user }: { room: RoomView; user: PublicUser }) {
  const [state, action, pending] = useActionState(postMessage, initial)
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state])

  return (
    <div className="grid gap-4">
      {room.messages.length === 0 ? (
        <p className="text-sm leading-6 text-muted-foreground">
          The room is quiet. Notes stay here until someone pins them onto the timeline.
        </p>
      ) : (
        <ul className="grid gap-3">
          {room.messages.map((message) => (
            <li key={message.id} className="rounded-xl border border-border/80 p-3">
              <p className="text-xs text-muted-foreground">
                {message.authorName} · {formatWhen(message.createdAt)}
              </p>
              <p className="mt-2 text-sm leading-6">{message.body}</p>
              {message.pinnedMilestoneId ? (
                <a href={`#${message.pinnedMilestoneId}`} className="mt-2 inline-block text-xs text-sourced">
                  On the timeline
                </a>
              ) : room.canEdit ? (
                <PinForm roomId={room.clone.id} messageId={message.id} body={message.body} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <form ref={formRef} action={action} className="grid gap-3">
        <input type="hidden" name="roomId" value={room.clone.id} />
        <Label htmlFor="note" className="sr-only">
          Note from {user.name}
        </Label>
        <Textarea id="note" name="body" placeholder="A note for this room" required />
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" variant="outline" disabled={pending} className="h-10 w-fit px-4">
          {pending ? "Sending…" : "Leave a note"}
        </Button>
      </form>
    </div>
  )
}

function Links({
  room,
  pins,
  lines,
}: {
  room: RoomView
  pins: MapPin[]
  lines: MapLine[]
}) {
  const [state, action, pending] = useActionState(addConnection, initial)
  const [confirmState, confirm, confirming] = useActionState(confirmConnection, initial)
  return (
    <div className="grid gap-5">
      <CaseMap pins={pins} lines={lines} />
      {room.connections.length === 0 ? (
        <p className="text-sm text-muted-foreground">No claim links this file to another yet.</p>
      ) : (
        <ul className="grid gap-3">
          {room.connections.map((link) => (
            <li key={link.id} className="rounded-xl border border-border/80 p-3 text-sm leading-6">
              <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                {connectionLabel(link.type)} · {link.confirmed ? "Confirmed" : "Unconfirmed"}
              </p>
              <p className="mt-2">
                <Link href={`/cases/${link.fromCaseId}`} className="underline decoration-border underline-offset-4">
                  {link.fromName}
                </Link>
                {" · "}
                <Link href={`/cases/${link.toCaseId}`} className="underline decoration-border underline-offset-4">
                  {link.toName}
                </Link>
              </p>
              <p className="mt-2 text-foreground/85">{link.note}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {link.ownerName}
                {link.sourceLabel ? ` · ${link.sourceLabel}` : ""}
                {link.confirmedNames.length ? ` · confirmed by ${link.confirmedNames.join(", ")}` : ""}
              </p>
              {!link.confirmed ? (
                <form action={confirm} className="mt-3">
                  <input type="hidden" name="roomId" value={room.clone.id} />
                  <input type="hidden" name="linkId" value={link.id} />
                  <Button type="submit" size="sm" variant="outline" disabled={confirming}>
                    Confirm this claim
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {confirmState.error ? <p className="text-sm text-destructive">{confirmState.error}</p> : null}
      <form action={action} className="grid gap-3 border-t border-border/80 pt-4">
        <input type="hidden" name="roomId" value={room.clone.id} />
        <p className="font-heading text-xl font-light">Link another file</p>
        <Label htmlFor="otherId">File</Label>
        <select
          id="otherId"
          name="otherId"
          className="h-10 rounded-lg border border-input bg-input/30 px-2.5 text-sm"
          defaultValue={room.otherCases[0]?.id}
        >
          {room.otherCases.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <Label htmlFor="type">Claim</Label>
        <select id="type" name="type" className="h-10 rounded-lg border border-input bg-input/30 px-2.5 text-sm">
          {linkTypes.map((type) => (
            <option key={type} value={type}>
              {connectionLabel(type)}
            </option>
          ))}
        </select>
        <Textarea name="note" placeholder="What the source supports, and what it does not" required />
        <Input name="sourceLabel" placeholder="Source name" className="h-10" required />
        <Input name="sourceUrl" placeholder="Source link" className="h-10" />
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="h-10 w-fit px-4">
          {pending ? "Linking…" : "Add the claim"}
        </Button>
      </form>
    </div>
  )
}

export function RoomDesk({
  room,
  user,
  pins,
  lines,
}: {
  room: RoomView
  user: PublicUser
  pins: MapPin[]
  lines: MapLine[]
}) {
  if (room.locked) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24">
        <p className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase">Private</p>
        <h1 className="mt-4 font-heading text-5xl font-light">This room is closed.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {room.caseFile.name} has a private clone. Only the owner can open it.
        </p>
        <Button render={<Link href={`/cases/${room.caseFile.id}`} />} className="mt-8 h-10 px-4" nativeButton={false}>
          Back to the file
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <p className="text-sm text-muted-foreground">
        <Link href="/cases" className="hover:text-foreground">
          Cases
        </Link>
        <span className="px-2">/</span>
        <Link href={`/cases/${room.caseFile.id}`} className="hover:text-foreground">
          {room.caseFile.name}
        </Link>
      </p>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase">
            {room.clone.visibility === "private" ? "Private room" : "Public room"} · {room.clone.ownerName}
          </p>
          <h1 className="mt-3 font-heading text-5xl leading-none font-light tracking-tight sm:text-6xl">
            {room.caseFile.name}
          </h1>
        </div>
        {room.clone.ownerId === user.id ? <VisibilityControl room={room} /> : null}
      </div>
      <p className="mt-6 max-w-2xl text-sm leading-6 text-muted-foreground">{room.caseFile.summary}</p>
      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)]">
        <section>
          <Timeline items={room.milestones} />
          {room.canEdit ? <Composer roomId={room.clone.id} /> : null}
        </section>
        <aside className="lg:sticky lg:top-20">
          <Tabs defaultValue="brief">
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="brief">Brief</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
            </TabsList>
            <TabsContent value="brief" className="pt-4" keepMounted>
              <BriefPanel room={room} />
            </TabsContent>
            <TabsContent value="notes" className="pt-4" keepMounted>
              <Notes room={room} user={user} />
            </TabsContent>
            <TabsContent value="links" className="pt-4" keepMounted>
              <Links room={room} pins={pins} lines={lines} />
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  )
}
