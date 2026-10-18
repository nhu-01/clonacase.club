"use client"

import { useEffect, useRef, useState } from "react"

const LINES = [
  { text: "Clone the Case,", italic: false },
  { text: "Find the Trace", italic: true },
]

export function PixelSlogan() {
  const root = useRef<HTMLHeadingElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [shown, setShown] = useState(false)
  const [live, setLive] = useState(true)

  useEffect(() => {
    const rootEl = root.current
    const canvasEl = canvas.current
    if (!rootEl || !canvasEl) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setShown(true)
      setLive(false)
      return
    }

    let frame = 0
    let dead = false
    const off = document.createElement("canvas")
    const tiny = document.createElement("canvas")

    const paintSource = () => {
      const box = rootEl.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.round(box.width * dpr))
      const height = Math.max(1, Math.round(box.height * dpr))
      off.width = width
      off.height = height
      canvasEl.width = width
      canvasEl.height = height
      const ctx = off.getContext("2d")
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)
      const lines = [...rootEl.querySelectorAll<HTMLElement>("[data-slogan]")]
      for (const line of lines) {
        const style = getComputedStyle(line)
        const rect = line.getBoundingClientRect()
        ctx.font = style.font
        ctx.fillStyle = style.color
        ctx.textBaseline = "alphabetic"
        const sample = ctx.measureText(line.textContent || "")
        const ascent = sample.fontBoundingBoxAscent || Number.parseFloat(style.fontSize) * 0.78
        ctx.fillText(line.textContent || "", (rect.left - box.left) * dpr, (rect.top - box.top) * dpr + ascent)
      }
    }

    const draw = (block: number) => {
      const ctx = canvasEl.getContext("2d")
      if (!ctx) return
      const sw = Math.max(1, Math.round(canvasEl.width / block))
      const sh = Math.max(1, Math.round(canvasEl.height / block))
      tiny.width = sw
      tiny.height = sh
      const pixel = tiny.getContext("2d")
      if (!pixel) return
      pixel.imageSmoothingEnabled = false
      pixel.clearRect(0, 0, sw, sh)
      pixel.drawImage(off, 0, 0, sw, sh)
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
      ctx.drawImage(tiny, 0, 0, canvasEl.width, canvasEl.height)
    }

    const run = async () => {
      await document.fonts.ready
      if (dead) return
      paintSource()
      const start = performance.now()
      const dur = 1500
      const steps = [22, 16, 11, 7, 4, 2, 1]
      const tick = (now: number) => {
        if (dead) return
        const t = Math.min(1, (now - start) / dur)
        const eased = t < 0.08 ? 0 : Math.min(1, (t - 0.08) / 0.74)
        const curve = 1 - (1 - eased) ** 3
        const block = steps[Math.min(steps.length - 1, Math.floor(curve * steps.length))]
        draw(block)
        canvasEl.style.opacity = t > 0.84 ? String(1 - (t - 0.84) / 0.16) : "1"
        if (t >= 0.82) setShown(true)
        if (t < 1) frame = requestAnimationFrame(tick)
        else setLive(false)
      }
      frame = requestAnimationFrame(tick)
    }

    void run()
    return () => {
      dead = true
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <h1
      ref={root}
      className="relative mt-5 font-heading text-[clamp(2.7rem,7vw,5.4rem)] leading-[0.95] font-light tracking-[-0.035em]"
    >
      <span className={shown ? "slogan-in" : "slogan-hold"}>
        {LINES.map((line) => (
          <span key={line.text} data-slogan className={line.italic ? "block italic text-primary" : "block"}>
            {line.text}
          </span>
        ))}
      </span>
      {live ? (
        <canvas ref={canvas} className="slogan-canvas pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
      ) : null}
    </h1>
  )
}
