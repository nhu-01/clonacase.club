import { readFile } from "fs/promises"
import path from "path"
import { Pool, type PoolClient } from "pg"
import { posterBeats, type PosterBeat } from "@/lib/poster-beats"
import type { Brief, Clone, Connection, Message, Milestone, MilestoneKind, Store, ThreadPost, User } from "@/lib/types"
import { washingtonRecords } from "@/lib/washington-public"

const FILE = path.join(process.cwd(), "data", "store.json")
const KINDS = new Set<MilestoneKind>(["sourced", "lead", "inconclusive"])

type MemoryGlobal = typeof globalThis & { __tigerPool?: Pool }

const memory = globalThis as MemoryGlobal
let opening: Promise<void> | null = null
let timescale = false

export function usingTiger() {
  return Boolean(process.env.DATABASE_URL)
}

function pool() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set.")
  if (!memory.__tigerPool) {
    const local = /@(localhost|127\.0\.0\.1)(:|\/)/.test(url)
    memory.__tigerPool = new Pool({
      connectionString: url,
      max: 5,
      ssl: local ? undefined : { rejectUnauthorized: false },
    })
  }
  return memory.__tigerPool
}

function stamp(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T12:00:00.000Z`
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01T12:00:00.000Z`
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
}

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function day(value: Date | string) {
  return iso(value).slice(0, 10)
}

async function insertMany(
  client: PoolClient,
  table: string,
  columns: string[],
  rows: unknown[][],
  casts: Array<string | null> = [],
  suffix = "",
) {
  const width = 80
  for (let offset = 0; offset < rows.length; offset += width) {
    const slice = rows.slice(offset, offset + width)
    const params: unknown[] = []
    const tuples = slice.map((row) => {
      const marks = row.map((value, index) => {
        params.push(value)
        const cast = casts[index]
        return cast ? `$${params.length}::${cast}` : `$${params.length}`
      })
      return `(${marks.join(", ")})`
    })
    await client.query(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${tuples.join(", ")} ${suffix}`,
      params,
    )
  }
}

async function hypertable(client: PoolClient, table: string, column: string, interval: string) {
  if (!timescale) return
  const existing = await client.query(
    `SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_name = $1`,
    [table],
  )
  if (existing.rowCount) return
  await client.query(
    `SELECT create_hypertable($1, $2, chunk_time_interval => $3::interval, if_not_exists => TRUE, migrate_data => TRUE)`,
    [table, column, interval],
  )
}

async function ensureSchema(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS volunteers (
      id text PRIMARY KEY,
      name text NOT NULL
    );
    CREATE TABLE IF NOT EXISTS repositories (
      id text PRIMARY KEY,
      case_id text NOT NULL,
      owner_id text NOT NULL,
      visibility text NOT NULL,
      note text NOT NULL DEFAULT '',
      brief jsonb,
      created_at timestamptz NOT NULL
    );
    CREATE TABLE IF NOT EXISTS evidence (
      observed_at timestamptz NOT NULL,
      id text NOT NULL,
      repository_id text NOT NULL,
      title text NOT NULL,
      body text NOT NULL,
      kind text NOT NULL,
      source_label text NOT NULL,
      source_url text NOT NULL,
      image_url text NOT NULL,
      author_id text,
      origin text NOT NULL,
      created_at timestamptz NOT NULL,
      pinned_from text,
      PRIMARY KEY (observed_at, id)
    );
    CREATE TABLE IF NOT EXISTS room_messages (
      created_at timestamptz NOT NULL,
      id text NOT NULL,
      repository_id text NOT NULL,
      author_id text NOT NULL,
      body text NOT NULL,
      pinned_milestone_id text,
      PRIMARY KEY (created_at, id)
    );
    CREATE TABLE IF NOT EXISTS threads (
      created_at timestamptz NOT NULL,
      id text NOT NULL,
      case_id text NOT NULL,
      author_id text NOT NULL,
      body text NOT NULL,
      PRIMARY KEY (created_at, id)
    );
    CREATE TABLE IF NOT EXISTS case_links (
      id text PRIMARY KEY,
      from_case_id text NOT NULL,
      to_case_id text NOT NULL,
      owner_id text NOT NULL,
      link_type text NOT NULL,
      note text NOT NULL,
      source_label text NOT NULL,
      source_url text NOT NULL,
      confirmed_by text[] NOT NULL DEFAULT '{}',
      created_at timestamptz NOT NULL
    );
    CREATE TABLE IF NOT EXISTS poster_events (
      occurred_at timestamptz NOT NULL,
      case_id text NOT NULL,
      kind text NOT NULL,
      label text NOT NULL,
      title text NOT NULL,
      body text NOT NULL,
      href text NOT NULL,
      source text NOT NULL,
      PRIMARY KEY (occurred_at, case_id, kind)
    );
  `)
  await hypertable(client, "evidence", "observed_at", "365 days")
  await hypertable(client, "room_messages", "created_at", "30 days")
  await hypertable(client, "threads", "created_at", "30 days")
  await hypertable(client, "poster_events", "occurred_at", "365 days")
  await client.query(`
    CREATE INDEX IF NOT EXISTS evidence_repository ON evidence (repository_id, observed_at);
    CREATE INDEX IF NOT EXISTS threads_case ON threads (case_id, created_at);
    CREATE INDEX IF NOT EXISTS poster_events_case ON poster_events (case_id, occurred_at);
  `)
}

async function seedPosters(client: PoolClient) {
  const count = await client.query<{ n: number }>(`SELECT count(*)::int AS n FROM poster_events`)
  if (Number(count.rows[0]?.n ?? 0) > 0) return
  const rows: unknown[][] = []
  for (const record of washingtonRecords) {
    for (const beat of posterBeats(record)) {
      rows.push([
        stamp(beat.sort),
        record.id,
        beat.kind,
        beat.label,
        beat.title,
        beat.body,
        beat.href,
        beat.source,
      ])
    }
  }
  await insertMany(
    client,
    "poster_events",
    ["occurred_at", "case_id", "kind", "label", "title", "body", "href", "source"],
    rows,
    [],
    "ON CONFLICT DO NOTHING",
  )
}

async function importFile(client: PoolClient) {
  const count = await client.query<{ n: number }>(`SELECT count(*)::int AS n FROM repositories`)
  const threads = await client.query<{ n: number }>(`SELECT count(*)::int AS n FROM threads`)
  if (Number(count.rows[0]?.n ?? 0) > 0 || Number(threads.rows[0]?.n ?? 0) > 0) return
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
    await writeAll(client, store)
  } catch {
    return
  }
}

async function writeAll(client: PoolClient, store: Store) {
  await client.query(`DELETE FROM evidence`)
  await client.query(`DELETE FROM room_messages`)
  await client.query(`DELETE FROM threads`)
  await client.query(`DELETE FROM case_links`)
  await client.query(`DELETE FROM repositories`)
  await client.query(`DELETE FROM volunteers`)

  const volunteers = store.users.filter((user) => user.id && user.name && !user.email && !user.passwordHash)
  await insertMany(
    client,
    "volunteers",
    ["id", "name"],
    volunteers.map((user) => [user.id, user.name]),
  )
  await insertMany(
    client,
    "repositories",
    ["id", "case_id", "owner_id", "visibility", "note", "brief", "created_at"],
    store.clones.map((clone) => [
      clone.id,
      clone.caseId,
      clone.ownerId,
      clone.visibility,
      clone.note ?? "",
      clone.brief ? JSON.stringify(clone.brief) : null,
      stamp(clone.createdAt),
    ]),
    [null, null, null, null, null, "jsonb", null],
  )

  const evidence: unknown[][] = []
  for (const clone of store.clones) {
    for (const item of clone.milestones) {
      evidence.push([
        stamp(item.date),
        item.id,
        clone.id,
        item.title,
        item.body,
        item.kind,
        item.sourceLabel,
        item.sourceUrl,
        item.imageUrl,
        item.authorId,
        item.origin,
        stamp(item.createdAt),
        item.pinnedFromMessageId ?? null,
      ])
    }
  }
  await insertMany(
    client,
    "evidence",
    [
      "observed_at",
      "id",
      "repository_id",
      "title",
      "body",
      "kind",
      "source_label",
      "source_url",
      "image_url",
      "author_id",
      "origin",
      "created_at",
      "pinned_from",
    ],
    evidence,
  )
  await insertMany(
    client,
    "room_messages",
    ["created_at", "id", "repository_id", "author_id", "body", "pinned_milestone_id"],
    store.messages.map((message) => [
      stamp(message.createdAt),
      message.id,
      message.cloneId,
      message.authorId,
      message.body,
      message.pinnedMilestoneId,
    ]),
  )
  await insertMany(
    client,
    "threads",
    ["created_at", "id", "case_id", "author_id", "body"],
    store.threads.map((post) => [stamp(post.createdAt), post.id, post.caseId, post.authorId, post.body]),
  )
  await insertMany(
    client,
    "case_links",
    [
      "id",
      "from_case_id",
      "to_case_id",
      "owner_id",
      "link_type",
      "note",
      "source_label",
      "source_url",
      "confirmed_by",
      "created_at",
    ],
    store.connections.map((link) => [
      link.id,
      link.fromCaseId,
      link.toCaseId,
      link.ownerId,
      link.type,
      link.note,
      link.sourceLabel,
      link.sourceUrl,
      link.confirmedBy,
      stamp(link.createdAt),
    ]),
    [null, null, null, null, null, null, null, null, "text[]", null],
  )
}

async function open() {
  const db = pool()
  const client = await db.connect()
  try {
    const ext = await client.query(`SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'`)
    timescale = Boolean(ext.rowCount)
    await client.query("BEGIN")
    await ensureSchema(client)
    await seedPosters(client)
    await importFile(client)
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}

function ready() {
  if (!opening) {
    opening = open().catch((error) => {
      opening = null
      throw error
    })
  }
  return opening
}

function kindOf(value: string): MilestoneKind {
  return KINDS.has(value as MilestoneKind) ? (value as MilestoneKind) : "lead"
}

function milestoneFrom(row: {
  observed_at: Date | string
  id: string
  title: string
  body: string
  kind: string
  source_label: string
  source_url: string
  image_url: string
  author_id: string | null
  origin: string
  created_at: Date | string
  pinned_from: string | null
}): Milestone {
  return {
    id: row.id,
    date: day(row.observed_at),
    title: row.title,
    body: row.body,
    kind: kindOf(row.kind),
    sourceLabel: row.source_label,
    sourceUrl: row.source_url,
    imageUrl: row.image_url,
    authorId: row.author_id,
    createdAt: iso(row.created_at),
    origin: row.origin === "file" ? "file" : "room",
    ...(row.pinned_from ? { pinnedFromMessageId: row.pinned_from } : {}),
  }
}

export async function loadDesk(): Promise<Store> {
  await ready()
  const db = pool()
  const [volunteers, repos, evidence, messages, threads, links] = await Promise.all([
    db.query<{ id: string; name: string }>(`SELECT id, name FROM volunteers`),
    db.query<{
      id: string
      case_id: string
      owner_id: string
      visibility: string
      note: string
      brief: Brief | null
      created_at: Date | string
    }>(`SELECT id, case_id, owner_id, visibility, note, brief, created_at FROM repositories`),
    db.query<{
      observed_at: Date | string
      id: string
      repository_id: string
      title: string
      body: string
      kind: string
      source_label: string
      source_url: string
      image_url: string
      author_id: string | null
      origin: string
      created_at: Date | string
      pinned_from: string | null
    }>(
      `SELECT observed_at, id, repository_id, title, body, kind, source_label, source_url, image_url, author_id, origin, created_at, pinned_from FROM evidence`,
    ),
    db.query<{
      created_at: Date | string
      id: string
      repository_id: string
      author_id: string
      body: string
      pinned_milestone_id: string | null
    }>(`SELECT created_at, id, repository_id, author_id, body, pinned_milestone_id FROM room_messages`),
    db.query<{ created_at: Date | string; id: string; case_id: string; author_id: string; body: string }>(
      `SELECT created_at, id, case_id, author_id, body FROM threads`,
    ),
    db.query<{
      id: string
      from_case_id: string
      to_case_id: string
      owner_id: string
      link_type: Connection["type"]
      note: string
      source_label: string
      source_url: string
      confirmed_by: string[]
      created_at: Date | string
    }>(
      `SELECT id, from_case_id, to_case_id, owner_id, link_type, note, source_label, source_url, confirmed_by, created_at FROM case_links`,
    ),
  ])

  const notes = new Map<string, Milestone[]>()
  for (const row of evidence.rows) {
    const list = notes.get(row.repository_id) ?? []
    list.push(milestoneFrom(row))
    notes.set(row.repository_id, list)
  }

  const users: User[] = volunteers.rows.map((user) => ({
    id: user.id,
    name: user.name,
    email: "",
    passwordHash: "",
    createdAt: "2024-05-01T00:00:00.000Z",
  }))

  const clones: Clone[] = repos.rows.map((row) => ({
    id: row.id,
    caseId: row.case_id,
    ownerId: row.owner_id,
    visibility: row.visibility === "public" ? "public" : "private",
    createdAt: iso(row.created_at),
    milestones: notes.get(row.id) ?? [],
    brief: row.brief,
    note: row.note ?? "",
  }))

  const roomMessages: Message[] = messages.rows.map((row) => ({
    id: row.id,
    cloneId: row.repository_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: iso(row.created_at),
    pinnedMilestoneId: row.pinned_milestone_id,
  }))

  const posts: ThreadPost[] = threads.rows.map((row) => ({
    id: row.id,
    caseId: row.case_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: iso(row.created_at),
  }))

  const connections: Connection[] = links.rows.map((row) => ({
    id: row.id,
    fromCaseId: row.from_case_id,
    toCaseId: row.to_case_id,
    ownerId: row.owner_id,
    type: row.link_type,
    note: row.note,
    sourceLabel: row.source_label,
    sourceUrl: row.source_url,
    confirmedBy: row.confirmed_by ?? [],
    createdAt: iso(row.created_at),
  }))

  return { version: 1, users, clones, connections, messages: roomMessages, threads: posts }
}

export async function saveDesk(store: Store) {
  await ready()
  const db = pool()
  const client = await db.connect()
  try {
    await client.query("BEGIN")
    await client.query("SELECT pg_advisory_xact_lock(42026)")
    await writeAll(client, store)
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export async function posterTimeline(caseId: string): Promise<PosterBeat[] | null> {
  if (!usingTiger()) return null
  await ready()
  const db = pool()
  const result = await db.query<{
    kind: string
    occurred_at: Date | string
    label: string
    title: string
    body: string
    href: string
    source: string
  }>(
    `SELECT kind, occurred_at, label, title, body, href, source
     FROM poster_events
     WHERE case_id = $1
     ORDER BY occurred_at, kind`,
    [caseId],
  )
  if (!result.rows.length) return null
  return result.rows.map((row) => ({
    kind: row.kind,
    sort: day(row.occurred_at),
    label: row.label,
    title: row.title,
    body: row.body,
    href: row.href,
    source: row.source,
  }))
}
