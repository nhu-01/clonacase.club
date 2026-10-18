import type { CSSProperties } from "react"

const LINES = [
  { text: "Clone the Case,", italic: false },
  { text: "Find the Trace", italic: true },
]

const STEP = 130
const LINE_PAUSE = 320

const lines = (() => {
  let cursor = 180
  return LINES.map((line) => {
    const chars = Array.from(line.text).map((char, index) => {
      const at = cursor
      cursor += STEP
      return { char, index, at }
    })
    cursor += LINE_PAUSE
    return { ...line, chars }
  })
})()

export function Slogan() {
  return (
    <h1 className="mt-5 font-heading text-[clamp(2.7rem,7vw,5.4rem)] leading-[0.95] font-light tracking-[-0.035em]">
      {lines.map((line) => (
        <span key={line.text} className={line.italic ? "slogan-line block w-fit pr-[0.12em] italic text-primary" : "slogan-line block w-fit pr-[0.08em]"}>
          {line.chars.map((item) => (
            <span key={item.index} className="slogan-char" style={{ "--at": `${item.at}ms` } as CSSProperties}>
              {item.char === " " ? "\u00a0" : item.char}
            </span>
          ))}
        </span>
      ))}
    </h1>
  )
}
