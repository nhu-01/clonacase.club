"use client"

import { useState } from "react"
import { SafeLink } from "@/components/safe-link"
import { formatDay, kindLabel } from "@/lib/format"
import type { MilestoneView } from "@/lib/types"

function hue(id: string) {
  let value = 0
  for (const char of id) value = (value * 33 + char.charCodeAt(0)) % 50
  return 28 + value
}

function Plate({ item }: { item: MilestoneView }) {
  const [failed, setFailed] = useState(false)
  const tone = hue(item.id)
  if (item.imageUrl && !failed) {
    return (
      // Image links are arbitrary URLs, so next/image cannot know the host.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.imageUrl}
        alt=""
        onError={() => setFailed(true)}
        className="mt-4 block h-auto w-full rounded-lg"
      />
    )
  }
  return (
    <div
      className="relative mt-4 h-16 overflow-hidden rounded-lg"
      style={{
        background: `linear-gradient(135deg, oklch(0.3 0.045 ${tone}), oklch(0.18 0.02 ${tone + 18}))`,
      }}
    >
      <div className="absolute inset-0 opacity-50 [background-image:repeating-linear-gradient(-18deg,transparent,transparent_7px,oklch(1_0_0/0.05)_7px,oklch(1_0_0/0.05)_8px)]" />
      <span className="absolute bottom-2 left-3 font-mono text-[10px] tracking-[0.16em] text-foreground/70 uppercase">
        {item.origin === "file" ? "Public file" : "Room note"}
      </span>
    </div>
  )
}

const tone: Record<MilestoneView["kind"], string> = {
  sourced: "text-sourced",
  lead: "text-lead",
  inconclusive: "text-inconclusive",
}

export function Timeline({ items }: { items: MilestoneView[] }) {
  return (
    <ol className="relative space-y-3 pl-8">
      <span
        aria-hidden="true"
        className="spine absolute top-1 bottom-1 left-[7px] w-px bg-linear-to-b from-primary via-primary/40 to-transparent"
      />
      {items.map((item, index) => (
        <li
          key={item.id}
          id={item.id}
          style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
          className="rise relative scroll-mt-24 rounded-2xl border border-border/80 bg-card/70 p-4"
        >
          <span
            className={`absolute top-6 -left-[27px] size-2.5 rounded-full ring-4 ring-background ${
              item.kind === "sourced"
                ? "bg-sourced"
                : item.kind === "lead"
                  ? "bg-lead"
                  : "bg-inconclusive"
            }`}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              {formatDay(item.date)}
            </p>
            <p className={`text-[11px] tracking-[0.16em] uppercase ${tone[item.kind]}`}>
              {kindLabel(item.kind)}
            </p>
          </div>
          <h3 className="mt-2 font-heading text-2xl leading-tight font-light">{item.title}</h3>
          {item.body ? <p className="mt-2 text-sm leading-6 text-foreground/80">{item.body}</p> : null}
          <Plate item={item} />
          <p className="mt-3 text-xs text-muted-foreground">
            {item.authorName}
            {item.sourceLabel ? (
              <>
                {" · "}
                <SafeLink href={item.sourceUrl} className="underline decoration-border underline-offset-4 hover:text-foreground">
                  {item.sourceLabel}
                </SafeLink>
              </>
            ) : null}
          </p>
        </li>
      ))}
    </ol>
  )
}
