"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useActionState } from "react"
import {
  addEvidence,
  deleteEvidence,
  deleteRepository,
  saveRepository,
  setVisibility,
  updateEvidence,
  writeBrief,
} from "@/lib/actions"
import { formatDay, kindLabel } from "@/lib/format"
import type { ActionState, Brief, MilestoneKind } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initial: ActionState = {}
const kinds: MilestoneKind[] = ["sourced", "lead", "inconclusive"]

export type RepoNote = {
  id: string
  date: string
  title: string
  body: string
  kind: MilestoneKind
  sourceLabel: string
  sourceUrl: string
  imageUrl: string
  origin: "file" | "room"
  authorName: string
}

function Media({ url }: { url: string }) {
  const [failed, setFailed] = useState(false)
  if (!url) return null
  const image = /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url)
  if (!image || failed) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-primary underline decoration-primary/40 underline-offset-4">
        Open attachment
      </a>
    )
  }
  return (
    // User-supplied media is an arbitrary https URL.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" onError={() => setFailed(true)} className="mt-3 block h-auto w-full" />
  )
}

function NoteFields({ note, prefix }: { note?: RepoNote; prefix: string }) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${prefix}-date`}>Date</Label>
          <Input id={`${prefix}-date`} name="date" type="date" required defaultValue={note?.date ?? ""} className="h-10" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${prefix}-kind`}>Label</Label>
          <select
            id={`${prefix}-kind`}
            name="kind"
            defaultValue={note?.kind ?? "lead"}
            className="h-10 border border-input bg-transparent px-2 text-sm"
          >
            {kinds.map((kind) => (
              <option key={kind} value={kind}>
                {kindLabel(kind)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${prefix}-title`}>Title</Label>
        <Input id={`${prefix}-title`} name="title" required defaultValue={note?.title ?? ""} className="h-10" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${prefix}-body`}>Note</Label>
        <Textarea id={`${prefix}-body`} name="body" defaultValue={note?.body ?? ""} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${prefix}-source`}>Source name</Label>
          <Input id={`${prefix}-source`} name="sourceLabel" defaultValue={note?.sourceLabel ?? ""} className="h-10" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${prefix}-url`}>Source link</Label>
          <Input id={`${prefix}-url`} name="sourceUrl" defaultValue={note?.sourceUrl ?? ""} placeholder="https://" className="h-10" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${prefix}-media`}>Media link</Label>
        <Input
          id={`${prefix}-media`}
          name="imageUrl"
          defaultValue={note?.imageUrl ?? ""}
          placeholder="https://… a photograph or document"
          className="h-10"
        />
      </div>
    </div>
  )
}

function BriefBlock({ brief }: { brief: Brief }) {
  return (
    <div className="mt-4 border border-primary/25 px-4 py-4 text-sm leading-6">
      <p>{brief.narrative}</p>
      {brief.gaps.map((gap) => (
        <p key={gap.ids.join("-")} className="mt-3 text-muted-foreground">
          {gap.text}
        </p>
      ))}
      {brief.leads.map((lead) => (
        <p key={lead.id} className="mt-3 text-muted-foreground">
          {lead.text}
        </p>
      ))}
      {brief.unresolved.map((item) => (
        <p key={item.id} className="mt-3 text-muted-foreground">
          {item.text}
        </p>
      ))}
      <p className="mt-3 text-muted-foreground">{brief.closing}</p>
    </div>
  )
}

export function RepositoryDesk({
  roomId,
  caseId,
  caseName,
  place,
  visibility,
  note,
  canEdit,
  notes,
  brief,
}: {
  roomId: string
  caseId: string
  caseName: string
  place: string
  visibility: "private" | "public"
  note: string
  canEdit: boolean
  notes: RepoNote[]
  brief: Brief | null
}) {
  const [saved, save, saving] = useActionState(saveRepository, initial)
  const [added, add, adding] = useActionState(addEvidence, initial)
  const addForm = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (added.ok) addForm.current?.reset()
  }, [added])
  const [draft, write, writing] = useActionState(writeBrief, initial)
  const [shared, share, sharing] = useActionState(setVisibility, initial)
  const ownNotes = notes.filter((item) => item.origin === "room")

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href={`/records/${caseId}`} className="hover:text-foreground">
          Public timeline
        </Link>
        <span className="px-2">/</span>
        <Link href="/resources" className="hover:text-foreground">
          Resources
        </Link>
      </p>
      <p className="mt-6 font-mono text-[11px] tracking-[0.2em] text-primary uppercase">
        {visibility === "private" ? "Private repository" : "Public repository"}
      </p>
      <h1 className="mt-3 font-heading text-5xl leading-none font-light tracking-tight">{caseName}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{place}</p>

      <section className="mt-10">
        <h2 className="font-heading text-3xl font-light">Working note</h2>
        {canEdit ? (
          <form action={save} className="mt-4 grid gap-3">
            <input type="hidden" name="roomId" value={roomId} />
            <Textarea name="note" defaultValue={note} placeholder="What you are collecting, in your own words" />
            {saved.error ? <p className="text-sm text-destructive">{saved.error}</p> : null}
            {saved.ok ? <p className="text-sm text-primary">Saved.</p> : null}
            <Button type="submit" disabled={saving} className="h-10 w-fit px-4">
              {saving ? "Saving…" : "Save"}
            </Button>
          </form>
        ) : (
          <p className="mt-4 text-sm leading-6">{note || "No working note yet."}</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-3xl font-light">Evidence</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          A dated note, the public page it came from, and a photograph or document link. Mark each one sourced, a lead, or inconclusive. A sourced note needs a source name.
        </p>
        {ownNotes.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nothing saved in this repository yet.</p>
        ) : (
          <ol className="relative mt-6 space-y-3 pl-8">
            <span aria-hidden="true" className="spine absolute top-1 bottom-1 left-[7px] w-0.5 bg-linear-to-b from-primary via-primary/50 to-transparent" />
            {ownNotes.map((item, index) => (
              <li key={item.id} style={{ animationDelay: `${index * 0.06}s` }} className="beat relative border border-primary/25 px-4 py-4">
                <span aria-hidden="true" className="absolute top-6 -left-[27px] size-2.5 rounded-full bg-primary ring-4 ring-background" />
                <p className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">
                  {formatDay(item.date)} · {kindLabel(item.kind)}
                </p>
                <h3 className="mt-1 font-heading text-2xl font-light">{item.title}</h3>
                {item.body ? <p className="mt-2 text-sm leading-6">{item.body}</p> : null}
                {item.sourceLabel ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.sourceUrl ? (
                      <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-primary/40 underline-offset-4">
                        {item.sourceLabel}
                      </a>
                    ) : (
                      item.sourceLabel
                    )}
                  </p>
                ) : null}
                <Media url={item.imageUrl} />
                {canEdit ? (
                  <div className="mt-4 flex flex-wrap gap-4">
                    <details>
                      <summary className="cursor-pointer text-xs text-muted-foreground">Edit</summary>
                      <EditNote roomId={roomId} note={item} />
                    </details>
                    <form action={deleteEvidence}>
                      <input type="hidden" name="roomId" value={roomId} />
                      <input type="hidden" name="milestoneId" value={item.id} />
                      <button type="submit" className="text-xs text-muted-foreground underline decoration-primary/30 underline-offset-4">
                        Delete
                      </button>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        )}

        {canEdit ? (
          <form ref={addForm} action={add} className="mt-8 border border-primary/25 px-4 py-4">
            <input type="hidden" name="roomId" value={roomId} />
            <p className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">Add a note</p>
            <div className="mt-4">
              <NoteFields prefix="new" />
            </div>
            {added.error ? <p className="mt-3 text-sm text-destructive">{added.error}</p> : null}
            {added.ok ? <p className="mt-3 text-sm text-primary">Saved to the repository.</p> : null}
            <Button type="submit" disabled={adding} className="mt-4 h-10 px-4">
              {adding ? "Saving…" : "Save note"}
            </Button>
          </form>
        ) : null}
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-3xl font-light">Draft</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          A draft reads only the notes in this repository. It does not search the web, name a suspect, or predict a place.
        </p>
        {brief ? <BriefBlock brief={brief} /> : null}
        {canEdit ? (
          <form action={write} className="mt-4">
            <input type="hidden" name="roomId" value={roomId} />
            {draft.error ? <p className="mb-3 text-sm text-destructive">{draft.error}</p> : null}
            <Button type="submit" variant="outline" disabled={writing} className="h-10 border-primary/40 px-4">
              {writing ? "Drafting…" : "Draft from this repository"}
            </Button>
          </form>
        ) : null}
      </section>

      {canEdit ? (
        <section className="mt-12 border-t border-primary/25 pt-8">
          <h2 className="font-heading text-3xl font-light">Who can open this</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A new repository is private. Sharing it puts your notes on the public timeline page. Confirm that the notes name no suspect.
          </p>
          <form action={share} className="mt-4 grid gap-3">
            <input type="hidden" name="roomId" value={roomId} />
            <input type="hidden" name="visibility" value={visibility === "public" ? "private" : "public"} />
            {visibility === "private" ? (
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="acknowledge" value="yes" className="mt-1" />
                These notes name no suspect.
              </label>
            ) : null}
            {shared.error ? <p className="text-sm text-destructive">{shared.error}</p> : null}
            <Button type="submit" variant="outline" disabled={sharing} className="h-10 w-fit border-primary/40 px-4">
              {visibility === "public" ? "Make private again" : "Share publicly"}
            </Button>
          </form>
          <form action={deleteRepository} className="mt-8 grid gap-3">
            <input type="hidden" name="roomId" value={roomId} />
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input type="checkbox" name="confirm" value="yes" className="mt-1" required />
              Delete this repository and the notes in it.
            </label>
            <Button type="submit" variant="outline" className="h-10 w-fit border-primary/40 px-4">
              Delete repository
            </Button>
          </form>
        </section>
      ) : null}
    </div>
  )
}

function EditNote({ roomId, note }: { roomId: string; note: RepoNote }) {
  const [state, action, pending] = useActionState(updateEvidence, initial)
  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="roomId" value={roomId} />
      <input type="hidden" name="milestoneId" value={note.id} />
      <NoteFields note={note} prefix={note.id} />
      {state.error ? <p className="mt-3 text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="mt-3 text-sm text-primary">Saved.</p> : null}
      <Button type="submit" disabled={pending} className="mt-3 h-10 px-4">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  )
}
