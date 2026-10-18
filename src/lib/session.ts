import { createHash, createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

const COOKIE = "clonacase_session"
const MAX_AGE = 60 * 60 * 24 * 14

export type SessionUser = {
  id: string
  name: string
  email: string
}

function secret() {
  return process.env.SESSION_SECRET || "clonacase-dev-session-secret"
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url")
}

export function demoIdentity(name: string, email: string): SessionUser {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || "guest"
  const tag = createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 6)
  return {
    id: `demo_${slug}_${tag}`,
    name: name.trim().slice(0, 40),
    email: email.trim().slice(0, 120),
  }
}

export async function readSession(): Promise<SessionUser | null> {
  const jar = await cookies()
  const raw = jar.get(COOKIE)?.value
  if (!raw) return null
  const dot = raw.lastIndexOf(".")
  if (dot <= 0) return null
  const body = raw.slice(0, dot)
  const mac = raw.slice(dot + 1)
  const expected = sign(body)
  const left = Buffer.from(mac)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionUser & { exp?: number }
    if (!parsed.id || !parsed.name || !parsed.exp || parsed.exp < Date.now()) return null
    return { id: parsed.id, name: parsed.name, email: parsed.email ?? "" }
  } catch {
    return null
  }
}

export async function setSession(user: SessionUser) {
  const exp = Date.now() + MAX_AGE * 1000
  const body = Buffer.from(JSON.stringify({ ...user, exp })).toString("base64url")
  const jar = await cookies()
  jar.set(COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export async function clearSession() {
  const jar = await cookies()
  jar.delete(COOKIE)
}
