import { createHmac, timingSafeEqual } from "crypto"
import { heldBack } from "@/lib/pull-review"

export type Thought = {
  action: "follow" | "stop" | "stop-all" | "list" | "latest" | "answer"
  name: string
  text: string
}

const ACTIONS = new Set<Thought["action"]>(["follow", "stop", "stop-all", "list", "latest", "answer"])

export function cleanOutgoing(text: string) {
  const trimmed = text.replace(/\s+/g, " ").trim().slice(0, 320)
  if (!trimmed || heldBack(trimmed)) return "I only have the public poster and the public repository notes."
  return trimmed
}

export async function think(text: string, notes: string): Promise<Thought | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const prompt = [
    "You text for clonacase on iMessage.",
    "Use one or two short sentences.",
    "Use only the notes. If they do not say it, say you do not have that.",
    "Never name a suspect, give a street address, name a relative, or guess where a person is.",
    "Never invent a sighting.",
    "follow subscribes them to a poster. stop ends one poster. stop-all ends every follow. list is what they follow. latest is the newest public update. answer is anything else.",
    "name is the poster name when the action needs one, otherwise empty.",
    "",
    notes || "No poster notes.",
    "",
    `Message: ${text}`,
  ].join("\n")
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 180,
          thinkingConfig: { thinkingLevel: "low" },
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              action: { type: "STRING", enum: ["follow", "stop", "stop-all", "list", "latest", "answer"] },
              name: { type: "STRING" },
              text: { type: "STRING" },
            },
            required: ["action", "name", "text"],
          },
        },
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return null
    const payload = (await response.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    const raw = (payload.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join("").trim()
    if (!raw) return null
    const parsed = JSON.parse(raw) as Thought
    if (!ACTIONS.has(parsed.action)) return null
    return {
      action: parsed.action,
      name: typeof parsed.name === "string" ? parsed.name.slice(0, 80) : "",
      text: typeof parsed.text === "string" ? parsed.text : "",
    }
  } catch {
    return null
  }
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function svixSecret(secret: string) {
  const encoded = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret
  return Buffer.from(encoded, "base64")
}

export function verifyPhotonWebhook(raw: string, headers: Headers, secret: string) {
  const timestamp =
    headers.get("webhook-timestamp") ||
    headers.get("svix-timestamp") ||
    headers.get("x-photon-timestamp") ||
    headers.get("x-spectrum-timestamp") ||
    ""
  const signature =
    headers.get("webhook-signature") ||
    headers.get("svix-signature") ||
    headers.get("x-photon-signature") ||
    headers.get("x-spectrum-signature") ||
    ""
  const id = headers.get("webhook-id") || headers.get("svix-id") || ""
  if (!timestamp || !signature) return false
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp))
  if (!Number.isFinite(age) || age > 5 * 60) return false
  const candidates = signature.split(" ")
  if (id) {
    const expected = createHmac("sha256", svixSecret(secret)).update(`${id}.${timestamp}.${raw}`).digest("base64")
    if (candidates.some((item) => item === `v1,${expected}` || item === expected)) return true
  }
  const spectrum = `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${raw}`).digest("hex")}`
  return candidates.some((item) => safeEqual(item, spectrum))
}
