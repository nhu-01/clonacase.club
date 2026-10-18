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
  phase: number
}

function smooth(value: number) {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}

function canvasFont(font: string, dpr: number) {
  return font.replace(/(\d*\.?\d+)px/g, (_, size) => `${Number.parseFloat(size) * dpr}px`)
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
      const lines = [...rootEl.querySelectorAll<HTMLElement>("[data-slogan]")]
      const fontSize = lines[0] ? Number.parseFloat(getComputedStyle(lines[0]).fontSize) || 48 : 48
      const cell = Math.max(4, Math.round(fontSize * 0.09 * dpr))
      const pad = cell * 3
      const inks = lines.map((line) => {
        const range = document.createRange()
        range.selectNodeContents(line)
        return range.getBoundingClientRect()
      })
      if (inks.length === 0) return []
      const minL = Math.min(...inks.map((ink) => ink.left))
      const minT = Math.min(...inks.map((ink) => ink.top))
      const maxR = Math.max(...inks.map((ink) => ink.right))
      const maxB = Math.max(...inks.map((ink) => ink.bottom))
      const originX = minL - pad / dpr
      const originY = minT - pad / dpr
      const cssWidth = maxR - minL + (pad * 2) / dpr
      const cssHeight = maxB - minT + (pad * 2) / dpr
      const width = Math.max(1, Math.ceil(cssWidth * dpr))
      const height = Math.max(1, Math.ceil(cssHeight * dpr))

      canvasEl.style.left = `${originX - box.left}px`
      canvasEl.style.top = `${originY - box.top}px`
      canvasEl.style.width = `${cssWidth}px`
      canvasEl.style.height = `${cssHeight}px`
      canvasEl.width = width
      canvasEl.height = height
      off.width = width
      off.height = height

      const ctx = off.getContext("2d")
      if (!ctx) return []
      ctx.clearRect(0, 0, width, height)
      lines.forEach((line, index) => {
        const style = getComputedStyle(line)
        const ink = inks[index]
        const text = line.textContent || ""
        ctx.font = canvasFont(style.font, dpr)
        ctx.fillStyle = style.color
        const spacing = Number.parseFloat(style.letterSpacing)
        if (!Number.isNaN(spacing)) ctx.letterSpacing = `${spacing * dpr}px`
        ctx.textBaseline = "alphabetic"
        const metrics = ctx.measureText(text)
        ctx.fillText(text, (ink.left - originX) * dpr, (ink.top - originY) * dpr + metrics.fontBoundingBoxAscent)
      })

      const data = ctx.getImageData(0, 0, width, height).data
      const pixels: Pixel[] = []
      for (let y = 0; y < height; y += cell) {
        for (let x = 0; x < width; x += cell) {
          const x1 = Math.min(width, x + cell)
          const y1 = Math.min(height, y + cell)
          let red = 0
          let green = 0
          let blue = 0
          let alpha = 0
          let count = 0
          const area = (x1 - x) * (y1 - y)
          for (let sy = y; sy < y1; sy++) {
            for (let sx = x; sx < x1; sx++) {
              const i = (sy * width + sx) * 4
              const sample = data[i + 3]
              if (sample < 36) continue
              red += data[i]
              green += data[i + 1]
              blue += data[i + 2]
              alpha += sample
              count++
            }
          }
          if (count === 0 || count / area < 0.16) continue
          pixels.push({
            x,
            y,
            size: cell,
            color: `rgba(${(red / count) | 0}, ${(green / count) | 0}, ${(blue / count) | 0}, ${alpha / count / 255})`,
            phase: ((x * 13 + y * 7) % 628) / 100,
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
      if (!ctx || pixels.length === 0) {
        setShown(true)
        setLive(false)
        return
      }
      const start = performance.now()
      const dur = 2100
      let revealed = false
      const tick = (now: number) => {
        if (dead) return
        const t = Math.min(1, (now - start) / dur)
        const elapsed = now - start
        const energy = 1 - smooth(Math.min(1, t / 0.62))
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
        const appear = smooth(Math.min(1, t / 0.1))
        for (const pixel of pixels) {
          const hop = Math.floor(elapsed / 68)
          const jx = Math.round(Math.sin(hop * 1.7 + pixel.phase) * pixel.size * 1.05 * energy)
          const jy = Math.round(Math.cos(hop * 1.3 + pixel.phase * 2) * pixel.size * 0.8 * energy)
          ctx.globalAlpha = appear
          ctx.fillStyle = pixel.color
          ctx.fillRect(pixel.x + jx, pixel.y + jy, pixel.size, pixel.size)
        }
        ctx.globalAlpha = 1
        canvasEl.style.opacity = t > 0.72 ? String(1 - (t - 0.72) / 0.28) : "1"
        if (!revealed && t >= 0.72) {
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
      className="relative mt-5 overflow-visible font-heading text-[clamp(2.7rem,7vw,5.4rem)] leading-[0.95] font-light tracking-[-0.035em]"
    >
      <span className={shown ? "slogan-in" : "slogan-hold"}>
        {LINES.map((line) => (
          <span key={line.text} data-slogan className={line.italic ? "block italic text-primary" : "block"}>
            {line.text}
          </span>
        ))}
      </span>
      {live ? <canvas ref={canvas} className="slogan-canvas pointer-events-none absolute opacity-0" aria-hidden="true" /> : null}
    </h1>
  )
}
