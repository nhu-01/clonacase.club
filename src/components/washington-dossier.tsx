"use client"

import { useState, type ReactNode } from "react"
import { posterBeats, type PosterBeat } from "@/lib/poster-beats"
import {
  washingtonMupuPhone,
  washingtonSource,
  type WashingtonRecord,
} from "@/lib/washington-public"

function Portrait({ record }: { record: WashingtonRecord }) {
  const [failed, setFailed] = useState(false)
  if (!record.image || failed) {
    return (
      <div className="relative grid aspect-[3/4] w-full place-items-center bg-[oklch(0.16_0.03_18)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_50%_42%,oklch(0.42_0.14_18/0.55),transparent_64%)]"
        />
        <span className="relative font-mono text-[10px] tracking-[0.18em] text-primary uppercase">
          Photograph withheld
        </span>
      </div>
    )
  }
  return (
    // Official Washington State Patrol photographs are hotlinked, not copied into the app.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={record.image}
      alt={`Public poster photograph of ${record.name}`}
      onError={() => setFailed(true)}
      className="block h-auto w-full"
    />
  )
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`
}

export function WashingtonDossier({
  record,
  action,
  events,
  fromMongo = false,
}: {
  record: WashingtonRecord
  action?: ReactNode
  events?: PosterBeat[]
  fromMongo?: boolean
}) {
  const timeline = events ?? posterBeats(record)
  const facts = [record.place ? `Missing out of ${record.place}` : null, record.height, record.weight]
    .filter(Boolean)
    .join(" · ")

  return (
    <article id="public-dossier" className="mt-8 border border-primary/35 bg-card/50">
      <header className="rise border-b border-primary/25 px-5 py-6 sm:px-7">
        <p className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase">Washington public record</p>
        <div className="mt-3 flex flex-col items-start gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <h2 className="font-heading text-4xl leading-none font-light tracking-tight sm:text-5xl">{record.name}</h2>
          {action}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {record.age} on the poster
          {facts ? ` · ${facts}` : ""}
        </p>
      </header>

      <div className="grid gap-px border-b border-primary/25 bg-primary/20 md:grid-cols-3">
        <figure className="beat flex h-full flex-col bg-card" style={{ animationDelay: "0.08s" }}>
          <div className="relative w-full">
            <svg
              aria-hidden="true"
              viewBox="0 0 100 130"
              preserveAspectRatio="none"
              className="poster-frame pointer-events-none absolute inset-0 z-10 h-full w-full text-primary"
            >
              <rect
                x="1.5"
                y="1.5"
                width="97"
                height="127"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.8"
                pathLength="100"
                strokeDasharray="100"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <Portrait record={record} />
          </div>
          <figcaption className="px-4 py-3 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            Photograph · official poster
          </figcaption>
        </figure>

        <a
          href={record.poster}
          target="_blank"
          rel="noreferrer"
          className="beat group flex min-h-56 flex-col justify-between bg-card px-5 py-5"
          style={{ animationDelay: "0.16s" }}
        >
          <span className="font-mono text-[10px] tracking-[0.18em] text-primary uppercase">Record</span>
          <span>
            <span className="block font-heading text-3xl font-light group-hover:text-primary">Official poster</span>
            <span className="mt-2 block text-sm leading-6 text-muted-foreground">
              PDF published {record.publishedLabel}, kept on the Washington State Patrol site.
            </span>
          </span>
          <span className="text-xs tracking-[0.14em] text-primary uppercase">Open the poster</span>
        </a>

        <div className="beat flex min-h-56 flex-col justify-between bg-card px-5 py-5" style={{ animationDelay: "0.24s" }}>
          <span className="font-mono text-[10px] tracking-[0.18em] text-primary uppercase">Report</span>
          <span>
            <span className="block font-heading text-3xl leading-tight font-light">
              {record.agency ?? "Investigating agency"}
            </span>
            {record.phone ? (
              <a href={telHref(record.phone)} className="mt-3 block text-sm text-foreground underline decoration-primary/40 underline-offset-4">
                {record.phone}
              </a>
            ) : null}
            <span className="mt-3 block text-sm leading-6 text-muted-foreground">
              Missing and Unidentified Persons Unit · {washingtonMupuPhone}
            </span>
          </span>
          <a
            href={washingtonSource}
            target="_blank"
            rel="noreferrer"
            className="text-xs tracking-[0.14em] text-primary uppercase"
          >
            State listing
          </a>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-7">
      {fromMongo ? (
        <p className="mb-4 font-mono text-[10px] tracking-[0.16em] text-primary uppercase">MongoDB · ordered by time</p>
      ) : null}
      <ol className="relative space-y-3 pl-8">
        <span
          aria-hidden="true"
          className="spine absolute top-1 bottom-1 left-[7px] w-0.5 bg-linear-to-b from-primary via-primary/70 to-transparent"
          style={{ animationDuration: "1.5s" }}
        />
        {timeline.map((event, index) => (
          <li
            key={event.kind}
            style={{ animationDelay: `${0.4 + index * 0.28}s` }}
            className="beat relative border border-primary/25 bg-background/40 px-4 py-4"
          >
            <span
              aria-hidden="true"
              className="dot-pulse absolute top-6 -left-[27px] size-2.5 rounded-full bg-primary ring-4 ring-background"
            />
            <p className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase">{event.label}</p>
            <h3 className="mt-1 font-heading text-2xl font-light">{event.title}</h3>
            {event.body ? <p className="mt-2 text-sm leading-6 text-foreground/85">{event.body}</p> : null}
            <a
              href={event.href}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-xs text-muted-foreground underline decoration-primary/40 underline-offset-4 hover:text-primary"
            >
              {event.source}
            </a>
          </li>
        ))}
      </ol>
      </div>

      <p className="border-t border-primary/25 px-5 py-4 text-xs leading-5 text-muted-foreground sm:px-7">
        This is the public poster, read in place. clonacase does not investigate it and does not send it to an agency.
        If you know something, call the number printed on the poster.
      </p>
    </article>
  )
}
