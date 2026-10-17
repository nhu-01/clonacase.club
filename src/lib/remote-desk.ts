import type { Store } from "@/lib/types"

const ENDPOINT =
  process.env.HEARTH_DESK_URL ??
  "https://crudcrud.com/api/d85357fbf2a54ac094b19ee3e223062b/desk"

let deskId: string | null = null

type DeskRecord = Store & { _id: string }

function toStore(record: DeskRecord): Store {
  return {
    version: record.version,
    users: record.users ?? [],
    clones: record.clones ?? [],
    connections: record.connections ?? [],
    messages: record.messages ?? [],
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T | null> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 180)
    throw new Error(`The shared desk returned ${response.status}${detail ? `: ${detail}` : ""}`)
  }
  const text = await response.text()
  if (!text) return null
  return JSON.parse(text) as T
}

function fullest(records: DeskRecord[]) {
  return [...records].sort((a, b) => {
    const weight = (item: DeskRecord) =>
      (item.clones?.length ?? 0) * 100 +
      (item.messages?.length ?? 0) * 10 +
      (item.connections?.length ?? 0) +
      (item.users?.length ?? 0)
    return weight(b) - weight(a)
  })[0]
}

async function put(store: Store) {
  if (!deskId) throw new Error("The shared desk has no record yet.")
  await request(`${ENDPOINT}/${deskId}`, {
    method: "PUT",
    body: JSON.stringify(store),
  })
}

export async function loadRemoteDesk(seed: (store: Store) => boolean): Promise<Store> {
  const list = await request<DeskRecord[]>(ENDPOINT)
  if (!Array.isArray(list)) throw new Error("The shared desk did not answer.")

  if (list.length === 0) {
    const store: Store = { version: 1, users: [], clones: [], connections: [], messages: [] }
    seed(store)
    const created = await request<DeskRecord>(ENDPOINT, {
      method: "POST",
      body: JSON.stringify(store),
    })
    if (!created?._id) throw new Error("The shared desk did not open.")
    deskId = created._id
    return toStore(created)
  }

  const record = fullest(list)
  deskId = record._id
  const store = toStore(record)
  if (seed(store)) await put(store)
  return store
}

export async function saveRemoteDesk(store: Store) {
  if (!deskId) await loadRemoteDesk(() => false)
  try {
    await put(store)
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("returned 404")) throw error
    deskId = null
    const created = await request<DeskRecord>(ENDPOINT, {
      method: "POST",
      body: JSON.stringify(store),
    })
    if (!created?._id) throw error
    deskId = created._id
  }
}
