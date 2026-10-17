import { randomBytes } from "crypto"
import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { CASES, DEMO_ACCOUNTS, SEEDED_CONNECTION } from "@/lib/seed"
import { hashPassword } from "@/lib/session"
import type {
  CaseFile,
  ConnectionView,
  PublicUser,
  RoomCard,
  RoomView,
  Store,
  User,
} from "@/lib/types"

const FILE = path.join(process.cwd(), "data", "store.json")
const VERSION = 1

let chain: Promise<unknown> = Promise.resolve()

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task)
  chain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function publicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email }
}

async function ensure(): Promise<Store> {
  await mkdir(path.dirname(FILE), { recursive: true })
  let store: Store
  try {
    const raw = await readFile(FILE, "utf8")
    store = JSON.parse(raw) as Store
  } catch {
    store = { version: VERSION, users: [], clones: [], connections: [], messages: [] }
  }

  if (!store.users) store.users = []
  if (!store.clones) store.clones = []
  if (!store.connections) store.connections = []
  if (!store.messages) store.messages = []
  store.version = VERSION

  let dirty = false
  for (const demo of DEMO_ACCOUNTS) {
    if (!store.users.some((user) => user.email === demo.email)) {
      store.users.push({
        id: demo.id,
        name: demo.name,
        email: demo.email,
        passwordHash: hashPassword(demo.password),
        createdAt: "2024-05-01T00:00:00.000Z",
      })
      dirty = true
    }
  }
  if (!store.connections.some((link) => link.id === SEEDED_CONNECTION.id)) {
    store.connections.push(SEEDED_CONNECTION)
    dirty = true
  }
  if (dirty) await writeFile(FILE, JSON.stringify(store, null, 2))
  return store
}

export function readStore() {
  return enqueue(ensure)
}

export function updateStore<T>(mutate: (store: Store) => T) {
  return enqueue(async () => {
    const store = await ensure()
    const result = mutate(store)
    await writeFile(FILE, JSON.stringify(store, null, 2))
    return result
  })
}

export function caseById(id: string) {
  return CASES.find((item) => item.id === id) ?? null
}

export function allCases(): CaseFile[] {
  return CASES
}

export async function findUserByEmail(email: string) {
  const store = await readStore()
  return store.users.find((user) => user.email === email.toLowerCase()) ?? null
}

export async function findUserById(id: string) {
  const store = await readStore()
  return store.users.find((user) => user.id === id) ?? null
}

export async function toPublicUser(id: string | null) {
  if (!id) return null
  const user = await findUserById(id)
  return user ? publicUser(user) : null
}

function authorName(store: Store, authorId: string | null) {
  if (!authorId) return "Public file"
  return store.users.find((user) => user.id === authorId)?.name ?? "Volunteer"
}

export function connectionViews(store: Store, caseId?: string): ConnectionView[] {
  return store.connections
    .filter((link) => !caseId || link.fromCaseId === caseId || link.toCaseId === caseId)
    .map((link) => ({
      ...link,
      fromName: caseById(link.fromCaseId)?.name ?? "Unknown file",
      toName: caseById(link.toCaseId)?.name ?? "Unknown file",
      ownerName: authorName(store, link.ownerId),
      confirmedNames: link.confirmedBy.map((id) => authorName(store, id)),
      confirmed: link.confirmedBy.length > 0,
    }))
}

export async function listRooms(userId: string): Promise<{ mine: RoomCard[]; shared: RoomCard[] }> {
  const store = await readStore()
  const cards = store.clones
    .map((clone) => {
      const file = caseById(clone.caseId)
      if (!file) return null
      const card: RoomCard = {
        id: clone.id,
        caseId: clone.caseId,
        caseName: file.name,
        city: file.city,
        visibility: clone.visibility,
        ownerName: authorName(store, clone.ownerId),
        ownerId: clone.ownerId,
        milestoneCount: file.timeline.length + clone.milestones.length,
        updatedLabel: clone.createdAt,
      }
      return card
    })
    .filter((card): card is RoomCard => card !== null)
    .sort((a, b) => b.updatedLabel.localeCompare(a.updatedLabel))

  return {
    mine: cards.filter((card) => card.ownerId === userId),
    shared: cards.filter((card) => card.visibility === "public" && card.ownerId !== userId),
  }
}

export async function roomForUserCase(userId: string, caseId: string) {
  const store = await readStore()
  return store.clones.find((clone) => clone.ownerId === userId && clone.caseId === caseId) ?? null
}

export async function getRoom(roomId: string, viewerId: string): Promise<RoomView | null> {
  const store = await readStore()
  const clone = store.clones.find((item) => item.id === roomId)
  if (!clone) return null
  const file = caseById(clone.caseId)
  if (!file) return null
  const locked = clone.visibility === "private" && clone.ownerId !== viewerId
  const canEdit = !locked && (clone.ownerId === viewerId || clone.visibility === "public")

  const milestones = [
    ...file.timeline.map((item) => ({ ...item, authorName: "Public file" })),
    ...clone.milestones.map((item) => ({ ...item, authorName: authorName(store, item.authorId) })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))

  return {
    clone: {
      id: clone.id,
      visibility: clone.visibility,
      createdAt: clone.createdAt,
      ownerId: clone.ownerId,
      ownerName: authorName(store, clone.ownerId),
    },
    locked,
    caseFile: file,
    milestones: locked ? [] : milestones,
    messages: locked
      ? []
      : store.messages
          .filter((message) => message.cloneId === clone.id)
          .map((message) => ({
            id: message.id,
            body: message.body,
            createdAt: message.createdAt,
            authorId: message.authorId,
            authorName: authorName(store, message.authorId),
            pinnedMilestoneId: message.pinnedMilestoneId,
          })),
    connections: locked ? [] : connectionViews(store, file.id),
    otherCases: CASES.filter((item) => item.id !== file.id).map((item) => ({
      id: item.id,
      name: item.name,
    })),
    canEdit,
    brief: locked ? null : clone.brief,
  }
}

export function newId(prefix: string) {
  return `${prefix}_${randomBytes(4).toString("hex")}`
}
