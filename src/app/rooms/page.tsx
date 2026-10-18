import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { deleteRepository } from "@/lib/actions"
import { Rise } from "@/components/motion"
import { getCurrentUser } from "@/lib/current"
import { formatDay } from "@/lib/format"
import { listRooms } from "@/lib/store"

export const metadata: Metadata = { title: "Repository" }

export default async function RoomsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/rooms")
  const { mine, shared } = await listRooms(user.id)

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14">
      <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">{user.name}</p>
      <h1 className="mt-4 font-heading text-5xl font-light tracking-tight sm:text-6xl">Repository</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
        Each clone starts private. Notes, sources, and media stay here until you share that repository.
      </p>
      <section className="mt-12">
        <h2 className="font-heading text-3xl font-light">Yours</h2>
        {mine.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No clones yet.{" "}
            <Link href="/archive" className="text-foreground underline decoration-border underline-offset-4">
              Open the archive
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border/80 border-y border-border/80">
            {mine.map((room, index) => (
              <Rise key={room.id} delay={index * 0.04}>
                <li className="flex flex-col gap-3 py-5 sm:flex-row sm:items-end sm:justify-between">
                  <Link href={`/repository/${room.id}`} className="min-w-0">
                    <span className="block font-heading text-3xl font-light">{room.caseName}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {room.lineage === "cloned" ? "Cloned · " : room.lineage === "fork" ? "Fork · " : ""}
                      {room.city} · {room.milestoneCount} notes · {room.mediaCount} media
                      {room.hypotheticalCount ? ` · hypothetical line` : ""} · opened {formatDay(room.updatedLabel)}
                    </span>
                    {room.note ? <span className="mt-1 block text-sm text-foreground/80">{room.note}</span> : null}
                  </Link>
                  <span className="flex items-center gap-4 sm:shrink-0">
                    <span className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">{room.visibility}</span>
                    <Link href={`/repository/${room.id}`} className="text-xs text-foreground underline decoration-primary/40 underline-offset-4">
                      Edit
                    </Link>
                    <form action={deleteRepository}>
                      <input type="hidden" name="roomId" value={room.id} />
                      <input type="hidden" name="confirm" value="yes" />
                      <button type="submit" className="text-xs text-muted-foreground underline decoration-primary/30 underline-offset-4">
                        Delete
                      </button>
                    </form>
                  </span>
                </li>
              </Rise>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-14">
        <h2 className="font-heading text-3xl font-light">Shared with the desk</h2>
        {shared.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No other public rooms yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/80 border-y border-border/80">
            {shared.map((room) => (
              <li key={room.id}>
                <Link href={`/repository/${room.id}`} className="flex items-end justify-between gap-4 py-5">
                  <span>
                    <span className="block font-heading text-3xl font-light">{room.caseName}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {room.ownerName} · {room.city}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                    Public
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
