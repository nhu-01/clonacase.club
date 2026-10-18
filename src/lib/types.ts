export type MilestoneKind = "sourced" | "lead" | "inconclusive"

export type Milestone = {
  id: string
  date: string
  title: string
  body: string
  kind: MilestoneKind
  sourceLabel: string
  sourceUrl: string
  imageUrl: string
  authorId: string | null
  createdAt: string
  origin: "file" | "room"
  pinnedFromMessageId?: string
  pullId?: string
}

export type Place = {
  id: string
  label: string
  detail: string
  x: number
  y: number
  certainty: "known" | "lead"
}

export type CaseFile = {
  id: string
  index: string
  name: string
  age: number
  lastSeen: string
  city: string
  region: string
  agency: string
  agencyPhone: string
  summary: string
  circumstances: string
  anchor: { x: number; y: number }
  places: Place[]
  timeline: Milestone[]
}

export type User = {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

export type PublicUser = {
  id: string
  name: string
  email: string
}

export type ConnectionType =
  | "shared-associate"
  | "overlapping-dates"
  | "shared-route"
  | "same-city"

export type Connection = {
  id: string
  fromCaseId: string
  toCaseId: string
  ownerId: string
  type: ConnectionType
  note: string
  sourceLabel: string
  sourceUrl: string
  confirmedBy: string[]
  createdAt: string
}

export type Message = {
  id: string
  cloneId: string
  authorId: string
  body: string
  createdAt: string
  pinnedMilestoneId: string | null
}

export type Brief = {
  generatedAt: string
  narrative: string
  narrativeIds: string[]
  gaps: { text: string; ids: string[] }[]
  unresolved: { text: string; id: string }[]
  leads: { text: string; id: string }[]
  closing: string
}

export type MediaKind = "article" | "photo" | "video" | "pdf"

export type RepoMedia = {
  id: string
  kind: MediaKind
  title: string
  url: string
  note: string
  createdAt: string
  pullId?: string
}

export type HypotheticalEvent = {
  id: string
  date: string
  time: string
  title: string
  body: string
  basedOn: string
  pullId?: string
}

export type DeskLineage = "original" | "cloned" | "fork"

export type Clone = {
  id: string
  caseId: string
  ownerId: string
  visibility: "private" | "public"
  createdAt: string
  milestones: Milestone[]
  media: RepoMedia[]
  hypothetical: HypotheticalEvent[]
  brief: Brief | null
  note: string
  lineage: DeskLineage
  sourceRoomId: string
  sourceOwnerName: string
}

export type PullKind = "note" | "media" | "hypothetical"
export type PullStatus = "open" | "accepted" | "declined"

export type PullRequest = {
  id: string
  sourceRoomId: string
  targetRoomId: string
  authorId: string
  targetOwnerId: string
  caseId: string
  kind: PullKind
  status: PullStatus
  createdAt: string
  title: string
  body: string
  date: string
  time: string
  mediaKind: MediaKind | ""
  url: string
}

export type ThreadPost = {
  id: string
  caseId: string
  authorId: string
  body: string
  createdAt: string
  parentId?: string
}

export type Store = {
  version: number
  users: User[]
  clones: Clone[]
  connections: Connection[]
  messages: Message[]
  threads: ThreadPost[]
  pulls: PullRequest[]
}

export type ActionState = {
  error?: string
  ok?: boolean
  review?: {
    status: "suggest" | "disqualify"
    quote: string
    title: string
    body: string
    dropped: string
    reason: string
    source: "gemini" | "local"
    token: string
    missingKey?: boolean
    date?: string
    time?: string
  }
}

export type MilestoneView = Milestone & { authorName: string }

export type ConnectionView = Connection & {
  fromName: string
  toName: string
  ownerName: string
  confirmedNames: string[]
  confirmed: boolean
}

export type MessageView = {
  id: string
  body: string
  createdAt: string
  authorId: string
  authorName: string
  pinnedMilestoneId: string | null
}

export type RoomView = {
  clone: {
    id: string
    visibility: "private" | "public"
    createdAt: string
    ownerId: string
    ownerName: string
    note: string
    media: RepoMedia[]
    hypothetical: HypotheticalEvent[]
    lineage: DeskLineage
    sourceRoomId: string
    sourceOwnerName: string
  }
  locked: boolean
  caseFile: CaseFile
  milestones: MilestoneView[]
  messages: MessageView[]
  connections: ConnectionView[]
  otherCases: { id: string; name: string }[]
  canEdit: boolean
  brief: Brief | null
}

export type RoomCard = {
  id: string
  caseId: string
  caseName: string
  city: string
  visibility: "private" | "public"
  ownerName: string
  ownerId: string
  milestoneCount: number
  mediaCount: number
  hypotheticalCount: number
  updatedLabel: string
  lineage: DeskLineage
  note: string
}
