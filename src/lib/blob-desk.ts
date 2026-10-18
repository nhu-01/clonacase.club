import { get, put } from "@vercel/blob"
import type { Store } from "@/lib/types"

const PATHNAME = "clonacase/desk.json"

function auth() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  return token ? { token } : {}
}

export function usingBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)
}

export async function loadBlobDesk(): Promise<Store | null> {
  const result = await get(PATHNAME, { access: "private", useCache: false, ...auth() })
  if (!result || result.statusCode !== 200 || !result.stream) return null
  const text = await new Response(result.stream).text()
  if (!text) return null
  return JSON.parse(text) as Store
}

export async function saveBlobDesk(store: Store) {
  await put(PATHNAME, JSON.stringify(store), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
    ...auth(),
  })
}
