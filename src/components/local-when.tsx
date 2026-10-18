"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"

export function localDay(now = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function LocalWhen({ iso }: { iso: string }) {
  const [label, setLabel] = useState("")

  useEffect(() => {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) {
      setLabel(iso)
      return
    }
    const sameYear = date.getFullYear() === new Date().getFullYear()
    setLabel(
      date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: sameYear ? undefined : "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    )
  }, [iso])

  return <time dateTime={iso}>{label || "\u00a0"}</time>
}

export function LocalDateField() {
  const ref = useRef<HTMLInputElement>(null)
  useLayoutEffect(() => {
    if (ref.current) ref.current.value = localDay()
  })
  return <input ref={ref} type="hidden" name="date" />
}
