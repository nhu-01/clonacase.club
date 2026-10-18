import { createHmac, timingSafeEqual } from "crypto"
import type { WashingtonRecord } from "@/lib/washington-public"

export type PullReview = {
  status: "suggest" | "disqualify"
  quote: string
  title: string
  body: string
  dropped: string
  reason: string
  source: "gemini" | "local"
  token: string
}

type Draft = {
  roomId: string
  pull: string
  title: string
  body: string
  date: string
  url: string
  mediaKind: string
}

export type SignedDraft = Draft & { exp: number }

const SUSPECT = /\b(suspects?|perpetrators?|killers?|murderers?|abductors?|kidnappers?|offender|accused|did it|whodunit)\b/i
const ADDRESS =
  /\b\d{1,6}\s+(?:[A-Za-z0-9.'-]+\s+){0,4}(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|way|court|ct|place|pl)\b\.?/i
const FAMILY =
  /\b(mother|father|mom|dad|brother|sister|wife|husband|son|daughter|girlfriend|boyfriend|ex-wife|ex-husband|ex)\b/i

function secret() {
  return process.env.SESSION_SECRET || "hearth-dev-session-secret"
}

function posterText(record: WashingtonRecord | null) {
  if (!record) return ""
  return [
    record.name,
    record.age ? `${record.age}` : "",
    record.place ?? "",
    record.lastSeen ?? "",
    record.summary,
    record.agency ?? "",
    record.height ?? "",
    record.weight ?? "",
  ]
    .filter(Boolean)
    .join(" ")
}

function posterBrief(record: WashingtonRecord | null) {
  if (!record) return "No poster text is available."
  return [
    `Name: ${record.name}`,
    `Age on the poster: ${record.age}`,
    record.place ? `Place: ${record.place}` : "",
    record.lastSeen ? `Last seen: ${record.lastSeen}` : "",
    record.agency ? `Agency: ${record.agency}` : "",
    record.height ? `Height: ${record.height}` : "",
    record.weight ? `Weight: ${record.weight}` : "",
    `Poster: ${record.summary}`,
  ]
    .filter(Boolean)
    .join("\n")
}

function sentences(value: string) {
  return value
    .split(/\n+|(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function blocked(sentence: string, poster: string) {
  if (SUSPECT.test(sentence) || ADDRESS.test(sentence)) return true
  if (!FAMILY.test(sentence)) return false
  const word = sentence.match(FAMILY)?.[1]?.toLowerCase() ?? ""
  return word ? !poster.toLowerCase().includes(word) : false
}

function quoteFrom(record: WashingtonRecord | null) {
  if (!record?.summary) return ""
  return record.summary.length > 180 ? `${record.summary.slice(0, 177)}…` : record.summary
}

export function localReview(record: WashingtonRecord | null, title: string, body: string): Omit<PullReview, "token" | "source"> {
  const poster = posterText(record)
  const titleBlocked = blocked(title, poster)
  const kept: string[] = []
  const dropped: string[] = []
  for (const sentence of sentences(body)) {
    if (blocked(sentence, poster)) dropped.push(sentence)
    else kept.push(sentence)
  }
  if (titleBlocked) dropped.unshift(title)
  const nextTitle = titleBlocked ? "Reading of the poster" : title
  const nextBody = kept.join(" ")
  const removed = dropped.join(" ")
  if (!nextBody && (titleBlocked || body.trim())) {
    return {
      status: "disqualify",
      quote: "",
      title: "",
      body: "",
      dropped: removed,
      reason: "This names a suspect, a private address, or a family member who is not on the poster. Nothing from it can be sent.",
    }
  }
  return {
    status: "suggest",
    quote: quoteFrom(record),
    title: nextTitle,
    body: nextBody,
    dropped: removed,
    reason: removed
      ? "The part that names a suspect, a private address, or a family member off the poster was held back."
      : "This can be sent. New public details stay.",
  }
}

function tighten(record: WashingtonRecord | null, review: Omit<PullReview, "token" | "source">): Omit<PullReview, "token" | "source"> {
  if (review.status === "disqualify") return { ...review, quote: "", title: "", body: "" }
  const local = localReview(record, review.title, review.body)
  if (local.status === "disqualify") {
    return {
      ...local,
      reason: review.reason || local.reason,
      dropped: [review.dropped, local.dropped].filter(Boolean).join(" "),
    }
  }
  return {
    status: "suggest",
    quote: review.quote || local.quote,
    title: local.title || review.title,
    body: local.body,
    dropped: [review.dropped, local.dropped].filter(Boolean).join(" "),
    reason: local.dropped ? local.reason : review.reason || local.reason,
  }
}

function covered(body: string, sentence: string) {
  const words = sentence.toLowerCase().match(/[a-z0-9']{4,}/g) ?? []
  if (!words.length) return body.toLowerCase().includes(sentence.toLowerCase())
  const hay = body.toLowerCase()
  const hits = words.filter((word) => hay.includes(word)).length
  return hits / words.length >= 0.6
}

function preserve(safeBody: string, suggested: string) {
  const missing = sentences(safeBody).filter((sentence) => !covered(suggested, sentence))
  if (!missing.length) return suggested
  return [suggested, ...missing].filter(Boolean).join(" ")
}

function sign(draft: Draft) {
  const exp = Date.now() + 30 * 60 * 1000
  const data = Buffer.from(JSON.stringify({ ...draft, exp })).toString("base64url")
  const mac = createHmac("sha256", secret()).update(data).digest("base64url")
  return `${data}.${mac}`
}

export function verifyReview(token: string): SignedDraft | null {
  const dot = token.lastIndexOf(".")
  if (dot <= 0) return null
  const data = token.slice(0, dot)
  const mac = token.slice(dot + 1)
  const expected = createHmac("sha256", secret()).update(data).digest("base64url")
  const left = Buffer.from(mac)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  try {
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as SignedDraft
    if (!parsed.exp || parsed.exp < Date.now()) return null
    if (!parsed.roomId || !parsed.title) return null
    return parsed
  } catch {
    return null
  }
}

async function geminiReview(record: WashingtonRecord | null, title: string, body: string) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const prompt = [
    "Review this draft before it is sent as a pull request.",
    "A volunteer may add new public information. Keep it.",
    "Keep a detail that is already on the poster, including age, height, weight, place, last seen, agency, and phone.",
    "Hold back only a sentence that names a suspect, gives a private street address, or names a family member who is not in the poster.",
    "Do not hold back a sentence only because it was not copied from the poster summary.",
    "Do not invent a fact, do not guess where the person went, and do not name a suspect.",
    "Disqualify only when no safe sentence remains.",
    "Quote a short line from the poster.",
    "",
    posterBrief(record),
    "",
    `Draft title: ${title}`,
    `Draft note: ${body || "(empty)"}`,
  ].join("\n")

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          thinkingConfig: { thinkingLevel: "low" },
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              status: { type: "STRING", enum: ["suggest", "disqualify"] },
              quote: { type: "STRING" },
              title: { type: "STRING" },
              body: { type: "STRING" },
              dropped: { type: "STRING" },
              reason: { type: "STRING" },
            },
            required: ["status", "quote", "title", "body", "dropped", "reason"],
          },
        },
      }),
      signal: AbortSignal.timeout(20000),
    },
  )
  if (!response.ok) return null
  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const parts = payload.candidates?.[0]?.content?.parts ?? []
  const raw = parts.map((part) => part.text ?? "").join("").trim()
  if (!raw) return null
  const parsed = JSON.parse(raw) as Omit<PullReview, "token" | "source">
  if (parsed.status !== "suggest" && parsed.status !== "disqualify") return null
  return parsed
}

export async function reviewDraft(
  record: WashingtonRecord | null,
  draft: Draft,
): Promise<PullReview> {
  let source: PullReview["source"] = "local"
  const safe = localReview(record, draft.title, draft.body)
  let review = safe
  try {
    const remote = await geminiReview(record, draft.title, draft.body)
    if (remote) {
      source = "gemini"
      if (safe.status === "disqualify") {
        review = { ...safe, reason: remote.reason || safe.reason }
      } else if (remote.status === "suggest") {
        const cleaned = tighten(record, { ...remote, dropped: safe.dropped })
        review = tighten(record, {
          ...cleaned,
          title: cleaned.title || safe.title,
          body: preserve(safe.body, cleaned.body),
          dropped: safe.dropped,
          quote: cleaned.quote || safe.quote,
          reason: safe.dropped ? safe.reason : cleaned.reason || safe.reason,
        })
      }
    }
  } catch {
    source = "local"
    review = safe
  }
  review = { ...review, title: review.title.slice(0, 140), body: review.body.slice(0, 800), dropped: review.dropped.slice(0, 800) }
  const token =
    review.status === "suggest"
      ? sign({
          roomId: draft.roomId,
          pull: draft.pull,
          title: review.title,
          body: review.body,
          date: draft.date,
          url: draft.url,
          mediaKind: draft.mediaKind,
        })
      : ""
  return { ...review, source, token }
}
