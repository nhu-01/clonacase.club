import { CASES } from "@/lib/seed"
import type { ConnectionView } from "@/lib/types"

export function mapModel(activeId: string, connections: ConnectionView[]) {
  const pins = CASES.flatMap((file) =>
    file.places.map((place) => ({
      id: place.id,
      caseId: file.id,
      person: file.name,
      label: place.label,
      detail: place.detail,
      x: place.x,
      y: place.y,
      certainty: place.certainty,
      active: file.id === activeId,
      href: `/cases/${file.id}`,
    })),
  )

  const lines = connections.flatMap((link) => {
    const from = CASES.find((item) => item.id === link.fromCaseId)
    const to = CASES.find((item) => item.id === link.toCaseId)
    if (!from || !to) return []
    return [
      {
        id: link.id,
        x1: from.anchor.x,
        y1: from.anchor.y,
        x2: to.anchor.x,
        y2: to.anchor.y,
        confirmed: link.confirmed,
        label: `${from.name} and ${to.name}`,
      },
    ]
  })

  return { pins, lines }
}
