import { readFile } from "fs/promises"
import path from "path"
import { MongoClient, type Db } from "mongodb"
import { posterBeats, type PosterBeat } from "@/lib/poster-beats"
import type { Connection, Message, Store, ThreadPost, User } from "@/lib/types"
import { washingtonRecords } from "@/lib/washington-public"

const FILE = path.join(process.cwd(), "data", "store.json")

type MemoryGlobal = typeof globalThis & { __mongoClient?: MongoClient }

const memory = globalThis as MemoryGlobal
let opening: Promise<Db> | null = null
let pausedUntil = 0

export function usingMongo() {
  return Boolean(process.env.MONGODB_URI)
}

async function connect() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI is not set.")
  if (!memory.__mongoClient) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 })
    try {
      await client.connect()
      memory.__mongoClient = client
    } catch (error) {
      await client.close().catch(() => undefined)
      throw error
    }
  }
  return memory.__mongoClient.db()
}

function ready() {
  if (Date.now() < pausedUntil) return Promise.reject(new Error("MongoDB is paused."))
  if (!opening) {
    opening = connect()
      .then(async (db) => {
        await ensure(db)
        pausedUntil = 0
        return db
      })
      .catch((error) => {
        opening = null
        const message = error instanceof Error ? error.message : ""
        const blocked = /ssl|whitelist|server selection|timed out|ENOTFOUND|ECONN/i.test(message)
        pausedUntil = Date.now() + (blocked ? 5 * 60_000 : 30_000)
        throw error
      })
  }
  return opening
}

async function ensure(db: Db) {
  await Promise.all([
    db.collection("volunteers").createIndex({ id: 1 }, { unique: true }),
    db.collection("repositories").createIndex({ id: 1 }, { unique: true }),
    db.collection("repositories").createIndex({ ownerId: 1, caseId: 1 }),
    db.collection("threads").createIndex({ caseId: 1, createdAt: 1 }),
    db.collection("posterEvents").createIndex({ caseId: 1, sort: 1, kind: 1 }, { unique: true }),
  ])

  const posters = await db.collection("posterEvents").countDocuments()
  if (posters === 0) {
    const docs = washingtonRecords.flatMap((record) =>
      posterBeats(record).map((beat) => ({
        caseId: record.id,
        kind: beat.kind,
        sort: beat.sort,
        label: beat.label,
        title: beat.title,
        body: beat.body,
        href: beat.href,
        source: beat.source,
      })),
    )
    if (docs.length) await db.collection("posterEvents").insertMany(docs)
  }

  const repos = await db.collection("repositories").countDocuments()
  const threads = await db.collection("threads").countDocuments()
  if (repos > 0 || threads > 0) return
  try {
    const raw = await readFile(FILE, "utf8")
    const parsed = JSON.parse(raw) as Store
    const store: Store = {
      version: 1,
      users: (parsed.users ?? []).map((user) => ({
        id: user.id,
        name: user.name,
        email: "",
        passwordHash: "",
        createdAt: user.createdAt,
      })),
      clones: parsed.clones ?? [],
      connections: parsed.connections ?? [],
      messages: parsed.messages ?? [],
      threads: parsed.threads ?? [],
    }
    if (!store.clones.length && !store.threads.length && !store.connections.length && !store.users.length) return
    await writeAll(db, store)
  } catch {
    return
  }
}

async function replace<T extends Record<string, unknown>>(db: Db, name: string, docs: T[]) {
  const collection = db.collection(name)
  await collection.deleteMany({})
  if (docs.length) await collection.insertMany(docs)
}

async function writeAll(db: Db, store: Store) {
  const volunteers = store.users
    .filter((user) => user.id && user.name)
    .map((user) => ({ id: user.id, name: user.name }))
  await replace(db, "volunteers", volunteers)
  await replace(
    db,
    "repositories",
    store.clones.map((clone) => ({
      id: clone.id,
      caseId: clone.caseId,
      ownerId: clone.ownerId,
      visibility: clone.visibility,
      createdAt: clone.createdAt,
      milestones: clone.milestones,
      brief: clone.brief,
      note: clone.note ?? "",
    })),
  )
  await replace(db, "messages", store.messages)
  await replace(db, "threads", store.threads)
  await replace(db, "connections", store.connections)
}

export async function loadDesk(): Promise<Store> {
  const db = await ready()
  const [volunteers, clones, messages, threads, connections] = await Promise.all([
    db.collection<User>("volunteers").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<Store["clones"][number]>("repositories").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<Message>("messages").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<ThreadPost>("threads").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<Connection>("connections").find({}, { projection: { _id: 0 } }).toArray(),
  ])
  return {
    version: 1,
    users: volunteers.map((user) => ({
      id: user.id,
      name: user.name,
      email: "",
      passwordHash: "",
      createdAt: user.createdAt || "2024-05-01T00:00:00.000Z",
    })),
    clones,
    connections,
    messages,
    threads,
  }
}

export async function saveDesk(store: Store) {
  const db = await ready()
  await writeAll(db, store)
}

export async function posterTimeline(caseId: string): Promise<PosterBeat[] | null> {
  if (!usingMongo()) return null
  let db: Db
  try {
    db = await ready()
  } catch {
    return null
  }
  const rows = await db
    .collection<PosterBeat & { caseId: string }>("posterEvents")
    .find({ caseId }, { projection: { _id: 0, caseId: 0 } })
    .sort({ sort: 1, kind: 1 })
    .toArray()
  if (!rows.length) return null
  return rows.map((row) => ({
    kind: row.kind,
    sort: row.sort,
    label: row.label,
    title: row.title,
    body: row.body,
    href: row.href,
    source: row.source,
  }))
}
