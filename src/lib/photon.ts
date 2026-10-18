const API = "https://api.photon.codes/v1"

export type PhotonConfig = {
  key: string
  project: string
  handle: string
  platform: "imessage"
}

export function photonConfig(): PhotonConfig | null {
  const key = process.env.PHOTON_API_KEY?.trim()
  const project = process.env.PHOTON_PROJECT_ID?.trim()
  const handle = process.env.PHOTON_AGENT_HANDLE?.trim()
  if (!key || !project || !handle) return null
  return { key, project, handle, platform: "imessage" }
}

export function phoneHandle(raw: string) {
  const trimmed = raw.trim()
  if (trimmed.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed.toLowerCase() : null
  const digits = trimmed.replace(/\D/g, "")
  if (trimmed.startsWith("+") && digits.length >= 10 && digits.length <= 15) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
  return null
}

type PhotonUser = { id: string; handle: string }
type PhotonSpace = { id: string }

export class PhotonError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function call<T>(config: PhotonConfig, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    signal: AbortSignal.timeout(8000),
    ...init,
    headers: {
      Authorization: `Bearer ${config.key}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })
  const text = await response.text()
  if (!response.ok) throw new PhotonError(response.status, text.slice(0, 240) || response.statusText)
  return text ? (JSON.parse(text) as T) : ({} as T)
}

export async function ensureUser(config: PhotonConfig, handle: string): Promise<PhotonUser> {
  return call<PhotonUser>(config, `/projects/${config.project}/users`, {
    method: "POST",
    body: JSON.stringify({ handle, platform: config.platform }),
  })
}

export async function ensureSpace(config: PhotonConfig, participantIds: string[]) {
  const key = `space-${participantIds.slice().sort().join("-")}`.slice(0, 255)
  return call<PhotonSpace>(config, `/projects/${config.project}/spaces`, {
    method: "POST",
    headers: { "idempotency-key": key },
    body: JSON.stringify({ participantIds, platform: config.platform }),
  })
}

export async function sendText(
  config: PhotonConfig,
  input: { spaceId: string; senderId: string; text: string; idempotencyKey: string; parentMessageId?: string },
) {
  return call(config, `/projects/${config.project}/messages`, {
    method: "POST",
    headers: { "idempotency-key": input.idempotencyKey.slice(0, 255) },
    body: JSON.stringify({
      spaceId: input.spaceId,
      senderId: input.senderId,
      ...(input.parentMessageId ? { parentMessageId: input.parentMessageId } : {}),
      content: { type: "text", format: "plain", text: input.text },
    }),
  })
}

export type InboundText = {
  id: string
  createdAt: string
  text: string
  phone: string
  spaceId: string
  agentUserId: string
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function plainText(content: unknown): string {
  const node = record(content)
  if (!node) return ""
  if (typeof node.text === "string" && (node.type === "text" || node.format === "plain")) return node.text
  if (Array.isArray(node.parts)) return node.parts.map(plainText).filter(Boolean).join("\n")
  return ""
}

function readInbound(item: unknown, agentHandle: string): InboundText | null {
  const message = record(item)
  if (!message || message.status !== "received") return null
  const sentBy = record(message.sentBy)
  const receivedBy = record(message.receivedBy)
  const space = record(message.space)
  if (!sentBy || !receivedBy || !space) return null
  if (sentBy.kind !== "human" || typeof sentBy.handle !== "string") return null
  if (typeof receivedBy.id !== "string" || typeof receivedBy.handle !== "string") return null
  if (receivedBy.handle !== agentHandle) return null
  if (typeof space.id !== "string" || typeof message.id !== "string") return null
  const text = plainText(message.content).trim()
  if (!text) return null
  return {
    id: message.id,
    createdAt: typeof message.createdAt === "string" ? message.createdAt : new Date().toISOString(),
    text,
    phone: phoneHandle(sentBy.handle) ?? sentBy.handle,
    spaceId: space.id,
    agentUserId: receivedBy.id,
  }
}

export async function listInbound(config: PhotonConfig, createdSince: string) {
  const query = new URLSearchParams({
    direction: "received",
    order: "asc",
    pageSize: "50",
    platform: config.platform,
    createdSince,
  })
  const page = await call<{ items?: unknown[]; nextPageToken?: string }>(
    config,
    `/projects/${config.project}/messages?${query.toString()}`,
  )
  return (page.items ?? []).map((item) => readInbound(item, config.handle)).filter((item): item is InboundText => item !== null)
}
