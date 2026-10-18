"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
import { Plus } from "lucide-react"
import {
  addEvidence,
  addHypothetical,
  addMedia,
  deleteEvidence,
  deleteHypothetical,
  deleteMedia,
  deleteRepository,
  seedHypothetical,
  setVisibility,
} from "@/lib/actions"
import { formatDay } from "@/lib/format"
import type { ActionState, HypotheticalEvent, MediaKind, RepoMedia } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initial: ActionState = {}
const mediaKinds: { value: MediaKind; label: string }[] = [
  { value: "article", label: "Article" },
  { value: "photo", label: "Photo" },
  { value: "video", label: "Video" },
  { value: "pdf", label: "PDF" },
]

type Note = {
  id: string
  date: string
  title: string
  body: string
}

function MediaPreview({ item }: { item: RepoMedia }) {
  if (item.kind === "photo") {
    return (
      // User media is an https link, not a file stored here.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.url} alt="" className="mt-3 block h-auto w-full" />
    )
  }
  if (item.kind === "video" && /\.(mp4|webm)(\?|$)/i.test(item.url)) {
    return <video src={item.url} controls className="mt-3 block h-auto w-full" />
  }
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-primary underline decoration-primary/40 underline-offset-4">
      Open {item.kind}
    </a>
  )
}

export function RepositoryControls({
  roomId,
  visibility,
}: {
  roomId: string
  visibility: "private" | "public"
}) {
  const [shared, share, sharing] = useActionState(setVisibility, initial)
  return (
    <div className="flex flex-col items-end gap-2">
      <form action={share} className="flex flex-col items-end gap-2">
        <input type="hidden" name="roomId" value={roomId} />
        <input type="hidden" name="visibility" value={visibility === "public" ? "private" : "public"} />
        {visibility === "private" ? (
          <label className="flex max-w-52 items-start gap-2 text-left text-xs text-muted-foreground">
            <input type="checkbox" name="acknowledge" value="yes" className="mt-0.5" required />
            These notes name no suspect.
          </label>
        ) : null}
        <Button type="submit" variant="outline" disabled={sharing} className="h-11 border-primary/40 px-4">
          {sharing ? "Saving…" : visibility === "private" ? "Make public" : "Make private"}
        </Button>
      </form>
      <form action={deleteRepository} className="flex items-center gap-2">
        <input type="hidden" name="roomId" value={roomId} />
        <input type="hidden" name="confirm" value="yes" />
        <button type="submit" className="text-xs text-muted-foreground underline decoration-primary/30 underline-offset-4">
          Delete repository
        </button>
      </form>
      {shared.error ? <p className="max-w-52 text-right text-xs text-destructive">{shared.error}</p> : null}
    </div>
  )
}

export function RepositoryStudio({
  roomId,
  canEdit,
  notes,
  media,
  hypothetical,
}: {
  roomId: string
  canEdit: boolean
  notes: Note[]
  media: RepoMedia[]
  hypothetical: HypotheticalEvent[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState<"closed" | "menu" | "note" | "media" | "hypothetical">("closed")
  const [lastView, setLastView] = useState<"menu" | "note" | "media" | "hypothetical">("menu")
  if (open !== "closed" && open !== lastView) setLastView(open)
  const view = open === "closed" ? lastView : open
  const [wasPending, setWasPending] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const [addedNote, addNote, addingNote] = useActionState(addEvidence, initial)
  const [addedMedia, addMediaAction, addingMedia] = useActionState(addMedia, initial)
  const [addedEvent, addEvent, addingEvent] = useActionState(addHypothetical, initial)
  const saved = Boolean(addedNote.ok || addedMedia.ok || addedEvent.ok)
  const pending = addingNote || addingMedia || addingEvent

  if (pending && !wasPending) {
    setWasPending(true)
  } else if (!pending && wasPending) {
    setWasPending(false)
    if (saved) {
      setOpen("closed")
      setRefreshTick((value) => value + 1)
    }
  }

  useEffect(() => {
    if (refreshTick > 0) router.refresh()
  }, [refreshTick, router])

  const sortedHypothetical = [...hypothetical].sort((a, b) => a.date.localeCompare(b.date))
  const showNotes = canEdit || notes.length > 0
  const showMedia = canEdit || media.length > 0
  const showHypothetical = canEdit || hypothetical.length > 0

  return (
    <div className="mt-12">
      {showNotes ? (
        <section>
          <h2 className="font-heading text-3xl font-light">Notes</h2>
          {notes.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {canEdit ? "No notes yet. Use the plus button to add one." : "No notes in this repository."}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {notes.map((note) => (
                <li key={note.id} className="border border-primary/25 px-4 py-4">
                  <p className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">{formatDay(note.date)}</p>
                  <h3 className="mt-1 font-heading text-2xl font-light">{note.title}</h3>
                  {note.body ? <p className="mt-2 text-sm leading-6">{note.body}</p> : null}
                  {canEdit ? (
                    <form action={deleteEvidence} className="mt-3">
                      <input type="hidden" name="roomId" value={roomId} />
                      <input type="hidden" name="milestoneId" value={note.id} />
                      <button type="submit" className="text-xs text-muted-foreground underline decoration-primary/30 underline-offset-4">
                        Delete
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {showMedia ? (
        <section className="mt-12">
          <h2 className="font-heading text-3xl font-light">Media</h2>
          {media.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {canEdit ? "No articles, photos, videos, or PDFs yet. Use the plus button to add one." : "No media in this repository."}
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {media.map((item) => (
                <li key={item.id} className="border border-primary/25 px-4 py-4">
                  <p className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">{item.kind}</p>
                  <h3 className="mt-1 font-heading text-2xl font-light">{item.title}</h3>
                  {item.note ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.note}</p> : null}
                  <MediaPreview item={item} />
                  {canEdit ? (
                    <form action={deleteMedia} className="mt-3">
                      <input type="hidden" name="roomId" value={roomId} />
                      <input type="hidden" name="mediaId" value={item.id} />
                      <button type="submit" className="text-xs text-muted-foreground underline decoration-primary/30 underline-offset-4">
                        Delete
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {showHypothetical ? (
        <section className="mt-12">
          <h2 className="font-heading text-3xl font-light">Hypothetical timeline</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            A reading of the poster. It is not a finding, and it does not name a suspect.
          </p>
          {hypothetical.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {canEdit
                ? "No hypothetical line yet. Use the plus button to start from the original timeline."
                : "No hypothetical timeline in this repository."}
            </p>
          ) : (
            <ol className="relative mt-6 space-y-3 pl-8">
              <span aria-hidden="true" className="spine absolute top-1 bottom-1 left-[7px] w-0.5 bg-linear-to-b from-primary via-primary/70 to-transparent" />
              {sortedHypothetical.map((event, index) => (
                <li key={event.id} className="beat relative border border-primary/25 bg-background/40 px-4 py-4" style={{ animationDelay: `${index * 0.12}s` }}>
                  <span aria-hidden="true" className="dot-pulse absolute top-6 -left-[27px] size-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <p className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">{formatDay(event.date)}</p>
                  <h3 className="mt-1 font-heading text-2xl font-light">{event.title}</h3>
                  {event.body ? <p className="mt-2 text-sm leading-6">{event.body}</p> : null}
                  {event.basedOn ? <p className="mt-2 text-xs text-muted-foreground">From the poster · {event.basedOn}</p> : null}
                  {canEdit ? (
                    <form action={deleteHypothetical} className="mt-3">
                      <input type="hidden" name="roomId" value={roomId} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <button type="submit" className="text-xs text-muted-foreground underline decoration-primary/30 underline-offset-4">
                        Delete
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}

      {canEdit ? (
        <div className="fixed right-4 bottom-4 z-40 sm:right-8 sm:bottom-8">
          <div
            inert={open === "closed"}
            aria-hidden={open === "closed"}
            className={`plus-sheet absolute right-0 bottom-[4.5rem] w-[min(100vw-2rem,24rem)] border border-primary/35 bg-background/95 p-4 shadow-2xl backdrop-blur-xl ${open === "closed" ? "" : "is-open"}`}
          >
            <div key={view} className="plus-swap">
              {view === "menu" ? (
                <div className="grid gap-2">
                  <p className="plus-choice font-mono text-[11px] tracking-[0.16em] text-primary uppercase">Add to this repository</p>
                  <button type="button" className="plus-choice py-2 text-left font-heading text-2xl font-light" onClick={() => setOpen("note")}>
                    Add notes
                  </button>
                  <button type="button" className="plus-choice py-2 text-left font-heading text-2xl font-light" onClick={() => setOpen("media")}>
                    Add media
                  </button>
                  <button type="button" className="plus-choice py-2 text-left font-heading text-2xl font-light" onClick={() => setOpen("hypothetical")}>
                    Hypothetical timeline
                  </button>
                </div>
              ) : null}
              {view === "note" ? (
                <form action={addNote} className="grid gap-3">
                  <input type="hidden" name="roomId" value={roomId} />
                  <input type="hidden" name="kind" value="lead" />
                  <p className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">Note</p>
                  <Label htmlFor="note-date">Date</Label>
                  <Input id="note-date" name="date" type="date" required className="h-10" />
                  <Label htmlFor="note-title">Title</Label>
                  <Input id="note-title" name="title" required minLength={3} className="h-10" />
                  <Label htmlFor="note-body">Note</Label>
                  <Textarea id="note-body" name="body" />
                  {addedNote.error ? <p className="text-sm text-destructive">{addedNote.error}</p> : null}
                  <Button type="submit" disabled={addingNote} className="h-10">
                    {addingNote ? "Saving…" : "Save note"}
                  </Button>
                </form>
              ) : null}
              {view === "media" ? (
                <form action={addMediaAction} className="grid gap-3">
                  <input type="hidden" name="roomId" value={roomId} />
                  <p className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">Media</p>
                  <Label htmlFor="media-kind">Kind</Label>
                  <select id="media-kind" name="kind" defaultValue="article" className="h-10 border border-input bg-transparent px-2 text-sm">
                    {mediaKinds.map((kind) => (
                      <option key={kind.value} value={kind.value}>
                        {kind.label}
                      </option>
                    ))}
                  </select>
                  <Label htmlFor="media-title">Title</Label>
                  <Input id="media-title" name="title" required minLength={2} className="h-10" />
                  <Label htmlFor="media-url">Link</Label>
                  <Input id="media-url" name="url" required placeholder="https://" className="h-10" />
                  <Label htmlFor="media-note">Note</Label>
                  <Textarea id="media-note" name="note" />
                  {addedMedia.error ? <p className="text-sm text-destructive">{addedMedia.error}</p> : null}
                  <Button type="submit" disabled={addingMedia} className="h-10">
                    {addingMedia ? "Saving…" : "Save media"}
                  </Button>
                </form>
              ) : null}
              {view === "hypothetical" ? (
                <div className="grid gap-4">
                  {hypothetical.length === 0 ? (
                    <form action={seedHypothetical} className="grid gap-2">
                      <input type="hidden" name="roomId" value={roomId} />
                      <p className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">From the poster</p>
                      <p className="text-sm leading-5 text-muted-foreground">
                        Copy the public dates into a line you can edit. It stays a reading of the poster.
                      </p>
                      <Button type="submit" variant="outline" className="h-10 border-primary/40">
                        Start from the original timeline
                      </Button>
                    </form>
                  ) : null}
                  <form action={addEvent} className="grid gap-3">
                    <input type="hidden" name="roomId" value={roomId} />
                    <p className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">Hypothetical event</p>
                    <Label htmlFor="hy-date">Date</Label>
                    <Input id="hy-date" name="date" type="date" required className="h-10" />
                    <Label htmlFor="hy-title">Title</Label>
                    <Input id="hy-title" name="title" required minLength={3} className="h-10" />
                    <Label htmlFor="hy-body">What you are considering</Label>
                    <Textarea id="hy-body" name="body" />
                    {addedEvent.error ? <p className="text-sm text-destructive">{addedEvent.error}</p> : null}
                    <Button type="submit" disabled={addingEvent} className="h-10">
                      {addingEvent ? "Saving…" : "Add to the line"}
                    </Button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            id="repo-plus"
            aria-expanded={open !== "closed"}
            aria-label={open === "closed" ? "Add to this repository" : "Close"}
            onClick={() => setOpen((value) => (value === "closed" ? "menu" : "closed"))}
            className="relative grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-300 hover:scale-105"
          >
            <Plus className={`repo-plus-icon size-6 ${open === "closed" ? "" : "is-open"}`} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
