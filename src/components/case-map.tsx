import Link from "next/link"

export type MapPin = {
  id: string
  caseId: string
  person: string
  label: string
  detail: string
  x: number
  y: number
  certainty: "known" | "lead"
  active: boolean
  href: string
}

export type MapLine = {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  confirmed: boolean
  label: string
}

export function CaseMap({ pins, lines }: { pins: MapPin[]; lines: MapLine[] }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border/80 bg-black/20">
      <svg viewBox="0 0 320 460" className="h-auto w-full" role="img" aria-label="Schematic of known places">
        <defs>
          <linearGradient id="coast" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="oklch(0.84 0.07 78)" stopOpacity="0.15" />
            <stop offset="1" stopColor="oklch(0.78 0.045 230)" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <rect width="320" height="460" fill="transparent" />
        <path
          d="M78 18 C 62 70, 96 108, 74 160 C 54 214, 98 246, 80 310 C 66 362, 102 400, 78 448"
          fill="none"
          stroke="url(#coast)"
          strokeWidth="28"
        />
        <path
          d="M78 18 C 62 70, 96 108, 74 160 C 54 214, 98 246, 80 310 C 66 362, 102 400, 78 448"
          fill="none"
          stroke="oklch(0.94 0.02 85 / 0.28)"
          strokeWidth="1"
        />
        {lines.map((line) => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.confirmed ? "oklch(0.84 0.07 78)" : "oklch(0.78 0.045 230)"}
            strokeWidth="1"
            strokeDasharray={line.confirmed ? "0" : "3 5"}
            strokeOpacity={line.confirmed ? 0.9 : 0.75}
          >
            <title>{line.label}</title>
          </line>
        ))}
        {pins.map((pin) => (
          <Link key={pin.id} href={pin.href}>
            <g>
              <circle
                cx={pin.x}
                cy={pin.y}
                r={pin.active ? 5 : 3.5}
                fill={pin.certainty === "known" ? "oklch(0.84 0.07 78)" : "transparent"}
                stroke={pin.certainty === "known" ? "oklch(0.94 0.02 85)" : "oklch(0.78 0.045 230)"}
                strokeWidth="1"
                strokeDasharray={pin.certainty === "lead" ? "2 2" : undefined}
              />
              {pin.active ? (
                <circle cx={pin.x} cy={pin.y} r="10" fill="none" stroke="oklch(0.84 0.07 78 / 0.45)" />
              ) : null}
              {pin.active ? (
                <text
                  x={pin.x + 14}
                  y={pin.y + 3}
                  fill="oklch(0.94 0.018 85)"
                  fontSize="9"
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                >
                  {pin.label}
                </text>
              ) : null}
            </g>
          </Link>
        ))}
      </svg>
      <figcaption className="border-t border-border/80 px-4 py-3 text-xs leading-5 text-muted-foreground">
        Known places from the public files. A line is a claim between files, not a route and not a prediction.
      </figcaption>
    </figure>
  )
}
