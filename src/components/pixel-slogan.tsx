"use client"

import { useEffect, useRef, useState } from "react"

const LINES = [
  { text: "Clone the Case,", italic: false },
  { text: "Find the Trace", italic: true },
]

type Pixel = {
  x: number
  y: number
  w: number
  h: number
  color: string
  phase: number
  clipX: number
  clipY: number
  clipW: number
  clipH: number
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
      const cell = Math.max(4, Math.round(fontSize * 0.11 * dpr))
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
      const glyphs = lines.map((line, index) => {
        const style = getComputedStyle(line)
        const ink = inks[index]
        const text = line.textContent || ""
        ctx.font = canvasFont(style.font, dpr)
        ctx.fillStyle = style.color
        const spacing = Number.parseFloat(style.letterSpacing)
        if (!Number.isNaN(spacing)) ctx.letterSpacing = `${spacing * dpr}px`
        ctx.textBaseline = "alphabetic"
        const metrics = ctx.measureText(text)
        const drawX = (ink.left - originX) * dpr
        const baseline = (ink.top - originY) * dpr + metrics.fontBoundingBoxAscent
        ctx.fillText(text, drawX, baseline)
        return {
          x: drawX - metrics.actualBoundingBoxLeft,
          y: baseline - metrics.actualBoundingBoxAscent,
          w: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
          h: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
        }
      })

      const data = ctx.getImageData(0, 0, width, height).data
      const pixels: Pixel[] = []
      for (const glyph of glyphs) {
        const x0 = Math.max(0, Math.floor(glyph.x))
        const y0 = Math.max(0, Math.floor(glyph.y))
        const x1 = Math.min(width, Math.ceil(glyph.x + glyph.w))
        const y1 = Math.min(height, Math.ceil(glyph.y + glyph.h))
        for (let y = y0; y < y1; y += cell) {
          for (let x = x0; x < x1; x += cell) {
            const bw = Math.min(cell, x1 - x)
            const bh = Math.min(cell, y1 - y)
            let red = 0
            let green = 0
            let blue = 0
            let count = 0
            for (let sy = y; sy < y + bh; sy++) {
              for (let sx = x; sx < x + bw; sx++) {
                const i = (sy * width + sx) * 4
                if (data[i + 3] < 48) continue
                red += data[i]
                green += data[i + 1]
                blue += data[i + 2]
                count++
              }
            }
            if (count < Math.max(2, bw * bh * 0.12)) continue
            pixels.push({
              x,
              y,
              w: bw,
              h: bh,
              color: `rgb(${(red / count) | 0}, ${(green / count) | 0}, ${(blue / count) | 0})`,
              phase: ((x * 13 + y * 7) % 628) / 100,
              clipX: x0,
              clipY: y0,
              clipW: x1 - x0,
              clipH: y1 - y0,
            })
          }
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
        const hop = Math.floor((now - start) / 80)
        const energy = 1 - smooth(Math.min(1, t / 0.62))
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
        for (const pixel of pixels) {
          const jx = Math.round(Math.sin(hop * 1.9 + pixel.phase) * pixel.w * 0.34 * energy)
          const jy = Math.round(Math.cos(hop * 1.4 + pixel.phase * 2) * pixel.h * 0.28 * energy)
          ctx.save()
          ctx.beginPath()
          ctx.rect(pixel.clipX, pixel.clipY, pixel.clipW, pixel.clipH)
          ctx.clip()
          ctx.fillStyle = pixel.color
          ctx.fillRect(pixel.x + jx, pixel.y + jy, pixel.w, pixel.h)
          ctx.restore()
        }
        if (energy === 0) {
          ctx.globalCompositeOperation = "destination-in"
          ctx.drawImage(off, 0, 0)
          ctx.globalCompositeOperation = "source-over"
        }
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
