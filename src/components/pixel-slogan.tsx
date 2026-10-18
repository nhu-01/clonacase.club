"use client"

import { useEffect, useRef, useState } from "react"

const LINES = [
  { text: "Clone the Case,", italic: false },
  { text: "Find the Trace", italic: true },
]

type Pixel = {
  x: number
  y: number
  size: number
  color: string
  delay: number
}

function smooth(value: number) {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}

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
      if (!ctx) return []
      ctx.clearRect(0, 0, width, height)
      const lines = [...rootEl.querySelectorAll<HTMLElement>("[data-slogan]")]
      for (const line of lines) {
        const style = getComputedStyle(line)
        const range = document.createRange()
        range.selectNodeContents(line)
        const ink = range.getBoundingClientRect()
        ctx.font = style.font
        ctx.fillStyle = style.color
        ctx.letterSpacing = style.letterSpacing
        ctx.textBaseline = "top"
        ctx.fillText(line.textContent || "", (ink.left - box.left) * dpr, (ink.top - box.top) * dpr)
      }

      const cell = Math.max(2, Math.round(3.5 * dpr))
      const data = ctx.getImageData(0, 0, width, height).data
      const pixels: Pixel[] = []
      for (let y = 0; y < height; y += cell) {
        for (let x = 0; x < width; x += cell) {
          const sx = Math.min(width - 1, x + (cell >> 1))
          const sy = Math.min(height - 1, y + (cell >> 1))
          const i = (sy * width + sx) * 4
          const alpha = data[i + 3]
          if (alpha < 48) continue
          const jitter = ((x * 13 + y * 7) % 17) / 17
          pixels.push({
            x,
            y,
            size: cell,
            color: `rgba(${data[i]}, ${data[i + 1]}, ${data[i + 2]}, ${alpha / 255})`,
            delay: (x / width) * 0.42 + jitter * 0.28,
          })
        }
      }
      return pixels
    }

    const run = async () => {
      await document.fonts.ready
      if (dead) return
      const pixels = paintSource()
      const ctx = canvasEl.getContext("2d")
      if (!ctx) return
      const start = performance.now()
      const dur = 1700
      let revealed = false
      const tick = (now: number) => {
        if (dead) return
        const t = Math.min(1, (now - start) / dur)
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
        for (const pixel of pixels) {
          const alpha = smooth((t - pixel.delay) / 0.38)
          if (alpha <= 0) continue
          ctx.globalAlpha = alpha
          ctx.fillStyle = pixel.color
          ctx.fillRect(pixel.x, pixel.y, pixel.size, pixel.size)
        }
        ctx.globalAlpha = 1
        canvasEl.style.opacity = t > 0.72 ? String(1 - (t - 0.72) / 0.28) : "1"
        if (!revealed && t >= 0.7) {
          revealed = true
          setShown(true)
        }
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
