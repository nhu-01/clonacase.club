import type { CaseFile, Connection, Milestone } from "@/lib/types"

const filed = "2024-05-01T00:00:00.000Z"

function fileMilestone(input: Omit<Milestone, "authorId" | "createdAt" | "origin" | "imageUrl" | "sourceUrl"> & {
  sourceUrl?: string
  imageUrl?: string
}): Milestone {
  return {
    imageUrl: "",
    sourceUrl: "",
    ...input,
    authorId: null,
    createdAt: filed,
    origin: "file",
  }
}

export const CASES: CaseFile[] = [
  {
    id: "case-mara",
    index: "01",
    name: "Mara Ellison",
    age: 34,
    lastSeen: "2024-03-12",
    city: "Portland",
    region: "Oregon",
    agency: "Portland Police Bureau, Missing Persons",
    agencyPhone: "(503) 555-0148",
    summary:
      "Left a late shift at a bookstore on Hawthorne. Her bicycle was still locked outside the next morning.",
    circumstances:
      "Mara Ellison was last confirmed at closing on 12 March 2024, outside a bookstore on Hawthorne Boulevard. A transit card in her name was used once, two days later, at Oregon City. Nothing after that date is sourced.",
    anchor: { x: 128, y: 148 },
    places: [
      {
        id: "mara-hawthorne",
        label: "Hawthorne",
        detail: "Bookstore, last confirmed presence",
        x: 128,
        y: 148,
        certainty: "known",
      },
      {
        id: "mara-oregon-city",
        label: "Oregon City",
        detail: "Single transit-card tap",
        x: 142,
        y: 176,
        certainty: "known",
      },
    ],
    timeline: [
      fileMilestone({
        id: "mara-reading",
        date: "2024-03-04",
        title: "Named in a Portland reading-group caption",
        body: "A neighborhood newsletter lists her at a Monday reading group. Helen Cho is in the same caption.",
        kind: "sourced",
        sourceLabel: "Demonstration newsletter caption",
        sourceUrl: "/sources/reading-group",
      }),
      fileMilestone({
        id: "mara-close",
        date: "2024-03-11",
        title: "Closed the bookstore with a coworker",
        body: "A coworker walked out with her at the end of the shift and watched her unlock the bicycle.",
        kind: "sourced",
        sourceLabel: "Bookstore statement, demonstration file",
      }),
      fileMilestone({
        id: "mara-bike",
        date: "2024-03-12",
        title: "Bicycle still locked on Hawthorne",
        body: "The bicycle was where she had left it. This is the last sourced place she was standing.",
        kind: "sourced",
        sourceLabel: "Demonstration case file, last-seen entry",
      }),
      fileMilestone({
        id: "mara-tap",
        date: "2024-03-14",
        title: "Transit card used at Oregon City",
        body: "One tap, in her name, at the station. No second tap that day.",
        kind: "sourced",
        sourceLabel: "Transit record summary, demonstration file",
      }),
      fileMilestone({
        id: "mara-river",
        date: "2024-03-20",
        title: "River-path description does not hold",
        body: "A neighbor described a woman in a dark coat near the river path. Clothing and height were not distinctive. The file marks this unresolved.",
        kind: "inconclusive",
        sourceLabel: "Neighbor note, demonstration file",
      }),
      fileMilestone({
        id: "mara-hold",
        date: "2024-04-02",
        title: "Library hold was never collected",
        body: "A book she had waitlisted was set aside and returned to the shelf. The hold itself is real. It does not show that she was in the building.",
        kind: "lead",
        sourceLabel: "Library notice, demonstration file",
      }),
    ],
  },
  {
    id: "case-jonah",
    index: "02",
    name: "Jonah Reed",
    age: 41,
    lastSeen: "2024-03-18",
    city: "Sacramento",
    region: "California",
    agency: "Sacramento Police Department",
    agencyPhone: "(916) 555-0172",
    summary:
      "Bought a one-way night bus ticket south from Sacramento Valley Station. No sourced record of him boarding.",
    circumstances:
      "Jonah Reed told a friend on 16 March 2024 that he was taking the night bus toward Medford. The ticket was purchased at Sacramento Valley Station on the 18th. A platform still shows a similar duffel. His face is not in the frame.",
    anchor: { x: 168, y: 236 },
    places: [
      {
        id: "jonah-station",
        label: "Sacramento Valley",
        detail: "Ticket purchased",
        x: 168,
        y: 236,
        certainty: "known",
      },
      {
        id: "jonah-grants",
        label: "Grants Pass",
        detail: "Motel name does not match",
        x: 126,
        y: 198,
        certainty: "lead",
      },
    ],
    timeline: [
      fileMilestone({
        id: "jonah-friend",
        date: "2024-03-16",
        title: "Told a friend he was going south",
        body: "The friend recalls a night bus and a duffel. No destination beyond Medford was named.",
        kind: "sourced",
        sourceLabel: "Friend statement, demonstration file",
      }),
      fileMilestone({
        id: "jonah-ticket",
        date: "2024-03-18",
        title: "One-way ticket purchased",
        body: "Purchased at Sacramento Valley Station, toward Medford. Purchase is not the same as boarding.",
        kind: "sourced",
        sourceLabel: "Ticket record, demonstration file",
      }),
      fileMilestone({
        id: "jonah-duffel",
        date: "2024-03-18",
        title: "Platform still shows a similar bag",
        body: "A camera still from the platform shows a duffel of a common color. The face is out of frame. The file does not treat this as him.",
        kind: "inconclusive",
        sourceLabel: "Station still, demonstration file",
      }),
      fileMilestone({
        id: "jonah-motel",
        date: "2024-03-19",
        title: "Motel log uses another name",
        body: "A walk-in at Grants Pass shares his date of birth and not his name. The desk clerk did not keep an image. Unconfirmed.",
        kind: "lead",
        sourceLabel: "Motel log note, demonstration file",
      }),
    ],
  },
  {
    id: "case-helen",
    index: "03",
    name: "Helen Cho",
    age: 29,
    lastSeen: "2024-03-09",
    city: "Oakland",
    region: "California",
    agency: "Oakland Police Department",
    agencyPhone: "(510) 555-0194",
    summary:
      "Did not arrive at a Sunday pottery class. Her car remained in a lot on Telegraph Avenue.",
    circumstances:
      "Helen Cho was expected at a pottery studio in Temescal on 9 March 2024 and did not arrive. The car registered to her was still in a paid lot on Telegraph the next morning. A week earlier she had been in Portland, at a neighborhood reading group also attended by Mara Ellison.",
    anchor: { x: 108, y: 268 },
    places: [
      {
        id: "helen-temescal",
        label: "Temescal",
        detail: "Missed pottery class",
        x: 108,
        y: 268,
        certainty: "known",
      },
      {
        id: "helen-telegraph",
        label: "Telegraph lot",
        detail: "Car remained overnight",
        x: 118,
        y: 284,
        certainty: "known",
      },
    ],
    timeline: [
      fileMilestone({
        id: "helen-reading",
        date: "2024-03-04",
        title: "Named in a Portland reading-group caption",
        body: "A neighborhood newsletter lists her among people at a Monday reading group. Mara Ellison is in the same caption.",
        kind: "sourced",
        sourceLabel: "Demonstration newsletter caption",
        sourceUrl: "/sources/reading-group",
      }),
      fileMilestone({
        id: "helen-class",
        date: "2024-03-09",
        title: "Did not arrive at pottery",
        body: "The studio marked her absent. This is the last day she was expected somewhere specific.",
        kind: "sourced",
        sourceLabel: "Studio roster, demonstration file",
      }),
      fileMilestone({
        id: "helen-car",
        date: "2024-03-10",
        title: "Car still in the Telegraph lot",
        body: "The lot receipt runs through the morning of the 10th. The car is a place. It is not a sighting.",
        kind: "sourced",
        sourceLabel: "Lot receipt, demonstration file",
      }),
      fileMilestone({
        id: "helen-text",
        date: "2024-03-11",
        title: "A text thread stops",
        body: "A friend says the last message was a plan to bring clay. The phone itself has not been examined in this file.",
        kind: "lead",
        sourceLabel: "Friend note, demonstration file",
      }),
    ],
  },
]

export const SEEDED_CONNECTION: Connection = {
  id: "link-reading",
  fromCaseId: "case-mara",
  toCaseId: "case-helen",
  ownerId: "user-ada",
  type: "shared-associate",
  note: "Both names appear in the same public caption for a Portland reading group on 4 March 2024. That is a shared associate in a public record. It is not evidence the disappearances are one case.",
  sourceLabel: "Demonstration newsletter caption",
  sourceUrl: "/sources/reading-group",
  confirmedBy: [],
  createdAt: "2024-05-02T15:00:00.000Z",
}

export const DEMO_ACCOUNTS = [
  {
    id: "user-ada",
    name: "Ada Voss",
    email: "ada@clonacase.club",
    password: "watchlight",
  },
  {
    id: "user-leif",
    name: "Leif Moran",
    email: "leif@clonacase.club",
    password: "watchlight",
  },
] as const
