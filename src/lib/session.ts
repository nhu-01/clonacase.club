import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

const COOKIE = "hearth_session"
const MAX_AGE = 60 * 60 * 24 * 14

function secret() {
  return process.env.SESSION_SECRET || "hearth-dev-session-secret"
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url")
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 32).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const next = scryptSync(password, salt, 32)
  const previous = Buffer.from(hash, "hex")
  if (next.length !== previous.length) return false
  return timingSafeEqual(next, previous)
}

export async function readSessionUserId() {
  const jar = await cookies()
  const raw = jar.get(COOKIE)?.value
  if (!raw) return null
  const [userId, exp, mac] = raw.split(".")
  if (!userId || !exp || !mac) return null
  const expected = sign(`${userId}.${exp}`)
  const left = Buffer.from(mac)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  if (Number(exp) < Date.now()) return null
  return userId
}

export async function setSession(userId: string) {
  const exp = Date.now() + MAX_AGE * 1000
  const payload = `${userId}.${exp}`
  const jar = await cookies()
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
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
