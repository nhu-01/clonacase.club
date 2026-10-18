import { formatPhone } from "@/lib/format"
import { heldBack } from "@/lib/pull-review"
import { ensureSpace, ensureUser, listInbound, photonConfig, sendText, type PhotonConfig } from "@/lib/photon"
import { caseById, newId, readStore, updateStore } from "@/lib/store"
import { washingtonRecords } from "@/lib/washington-public"

const SITE = "https://www.clonacase.club"

export function agentLine() {
  return photonConfig()?.handle ?? ""
}

function cleanTitle(title: string) {
  const text = title.replace(/\s+/g, " ").trim().slice(0, 120)
  if (!text || heldBack(text)) return "A new note"
  return text
}

function findCases(query: string) {
  const needle = query.trim().toLowerCase()
  if (needle.length < 3) return []
  const exact = washingtonRecords.filter((record) => record.name.toLowerCase() === needle || record.id === needle)
  if (exact.length) return exact
  return washingtonRecords.filter((record) => record.name.toLowerCase().includes(needle)).slice(0, 5)
}

export function answerText(text: string, following: string[]) {
  const words = text.trim().replace(/\s+/g, " ")
  const lower = words.toLowerCase()
  if (!lower || /^(help|\?|hi|hello|hey)$/.test(lower)) {
    return "clonacase. Text a name to follow that poster. list shows what you follow. stop and a name ends it. latest and a name reads the newest public note."
  }
  if (lower === "latest") return "Text latest and a name."
  if (lower === "list" || lower === "following" || lower === "mine") {
    return following.length ? `Following ${following.join(", ")}.` : "You are not following a poster yet. Text a name."
  }
  if (lower === "stop" || lower === "stop all" || lower === "unsubscribe") return "stop-all"
  const stop = /^(?:stop|unsubscribe)\s+(.+)$/i.exec(words)
  if (stop) return `stop:${stop[1]}`
  const latest = /^latest\s+(.+)$/i.exec(words)
  if (latest) return `latest:${latest[1]}`
  const follow = /^(?:subscribe|follow)\s+(.+)$/i.exec(words)
  if (follow) return `follow:${follow[1]}`
  return `follow:${words}`
}

async function reply(config: PhotonConfig, spaceId: string, senderId: string, text: string, key: string, parentMessageId?: string) {
  await sendText(config, { spaceId, senderId, text, idempotencyKey: key, parentMessageId })
}

async function linkPhone(phone: string, spaceId: string, agentUserId: string) {
  await updateStore((store) => {
    for (const watch of store.alerts ?? []) {
      if (watch.phone !== phone) continue
      watch.spaceId = spaceId
      watch.agentUserId = agentUserId
    }
  })
}

async function followCase(phone: string, userId: string, caseId: string, label: string, spaceId: string, agentUserId: string) {
  let created = ""
  await updateStore((store) => {
    if (!store.alerts) store.alerts = []
    const prior = store.alerts.find((watch) => watch.phone === phone && watch.kind === "case" && watch.targetId === caseId)
    if (prior) {
      prior.spaceId = spaceId || prior.spaceId
      prior.agentUserId = agentUserId || prior.agentUserId
      prior.userId = prior.userId || userId
      created = prior.id
      return
    }
    created = newId("alert")
    store.alerts.push({
      id: created,
      phone,
      userId,
      kind: "case",
      targetId: caseId,
      label,
      createdAt: new Date().toISOString(),
      spaceId,
      agentUserId,
    })
  })
  return created
}

async function latestLine(name: string) {
  const matches = findCases(name)
  if (matches.length !== 1) return matches.length ? `Which poster? ${matches.map((item) => item.name).join(", ")}.` : "No poster by that name."
  const store = await readStore()
  const rooms = store.clones.filter((clone) => clone.caseId === matches[0].id && clone.visibility === "public")
  const notes = rooms.flatMap((room) =>
    (room.milestones ?? [])
      .filter((item) => item.origin === "room")
      .map((item) => ({ title: item.title, at: item.createdAt, roomId: room.id })),
  )
  notes.sort((a, b) => b.at.localeCompare(a.at))
  const note = notes[0]
  if (!note) return `No public note on ${matches[0].name} yet.`
  return `${matches[0].name}: ${cleanTitle(note.title)}. ${SITE}/repository/${note.roomId}`
}

async function handleInbound(config: PhotonConfig, message: { id: string; text: string; phone: string; spaceId: string; agentUserId: string }) {
  await linkPhone(message.phone, message.spaceId, message.agentUserId)
  const store = await readStore()
  const mine = (store.alerts ?? []).filter((watch) => watch.phone === message.phone)
  const command = answerText(message.text, mine.map((watch) => watch.label))
  let text = command
  if (command === "stop-all") {
    await updateStore((current) => {
      current.alerts = (current.alerts ?? []).filter((watch) => watch.phone !== message.phone)
    })
    text = "Stopped. You will not get more texts from clonacase."
  } else if (command.startsWith("stop:")) {
    const matches = findCases(command.slice(5))
    if (matches.length !== 1) text = matches.length ? `Which poster? ${matches.map((item) => item.name).join(", ")}.` : "No poster by that name."
    else {
      await updateStore((current) => {
        current.alerts = (current.alerts ?? []).filter((watch) => !(watch.phone === message.phone && watch.kind === "case" && watch.targetId === matches[0].id))
      })
      text = `Stopped following ${matches[0].name}.`
    }
  } else if (command.startsWith("latest:")) {
    text = await latestLine(command.slice(7))
  } else if (command.startsWith("follow:")) {
    const matches = findCases(command.slice(7))
    if (matches.length !== 1) text = matches.length ? `Which poster? ${matches.map((item) => item.name).join(", ")}.` : "No poster by that name. Text the name as it appears on the poster."
    else {
      await followCase(message.phone, "", matches[0].id, matches[0].name, message.spaceId, message.agentUserId)
      text = `Following ${matches[0].name}. A new public note on that case will text you here.`
    }
  }
  await reply(config, message.spaceId, message.agentUserId, text, `clonacase-reply-${message.id}`, message.id)
}

export async function drainInbox() {
  const config = photonConfig()
  if (!config) return { checked: 0 }
  const store = await readStore()
  const handled = new Set(store.inbox?.handled ?? [])
  const since = new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
  let messages: Awaited<ReturnType<typeof listInbound>> = []
  try {
    messages = await listInbound(config, since)
  } catch (error) {
    console.error("Photon inbox did not answer.", error)
    return { checked: 0 }
  }
  let count = 0
  for (const message of messages) {
    if (handled.has(message.id)) continue
    try {
      await handleInbound(config, message)
      count += 1
    } catch (error) {
      console.error("Photon reply did not send.", error)
      continue
    }
    handled.add(message.id)
  }
  const next = [...handled].slice(-300)
  await updateStore((current) => {
    current.inbox = { handled: next }
  })
  return { checked: count }
}

export async function rememberWatch(input: {
  phone: string
  userId: string
  kind: "case" | "repository"
  targetId: string
  label: string
}) {
  let watchId = ""
  await updateStore((store) => {
    if (!store.alerts) store.alerts = []
    const prior = store.alerts.find(
      (watch) => watch.userId === input.userId && watch.kind === input.kind && watch.targetId === input.targetId,
    )
    if (prior) {
      const samePhone = prior.phone === input.phone
      prior.phone = input.phone
      prior.label = input.label
      if (!samePhone) {
        prior.spaceId = ""
        prior.agentUserId = ""
      }
      watchId = prior.id
      return
    }
    const sibling = store.alerts.find((watch) => watch.phone === input.phone && watch.spaceId)
    watchId = newId("alert")
    store.alerts.push({
      id: watchId,
      phone: input.phone,
      userId: input.userId,
      kind: input.kind,
      targetId: input.targetId,
      label: input.label,
      createdAt: new Date().toISOString(),
      spaceId: sibling?.spaceId ?? "",
      agentUserId: sibling?.agentUserId ?? "",
    })
  })
  return watchId
}

export async function forgetWatch(userId: string, kind: "case" | "repository", targetId: string) {
  await updateStore((store) => {
    store.alerts = (store.alerts ?? []).filter((watch) => !(watch.userId === userId && watch.kind === kind && watch.targetId === targetId))
  })
}

export async function watchFor(userId: string, kind: "case" | "repository", targetId: string) {
  const store = await readStore()
  return (store.alerts ?? []).find((watch) => watch.userId === userId && watch.kind === kind && watch.targetId === targetId) ?? null
}

async function openConversation(config: PhotonConfig, phone: string) {
  const agent = await ensureUser(config, config.handle)
  const person = await ensureUser(config, phone)
  const space = await ensureSpace(config, [agent.id, person.id])
  return { spaceId: space.id, agentUserId: agent.id }
}

export async function confirmWatch(watchId: string) {
  const config = photonConfig()
  if (!config) return "Saved. Texts start when the line is connected."
  await drainInbox()
  const store = await readStore()
  const watch = (store.alerts ?? []).find((item) => item.id === watchId)
  if (!watch) return "That alert was not saved."
  let spaceId = watch.spaceId
  let agentUserId = watch.agentUserId
  if (!spaceId || !agentUserId) {
    try {
      const opened = await openConversation(config, watch.phone)
      spaceId = opened.spaceId
      agentUserId = opened.agentUserId
      await updateStore((current) => {
        const item = (current.alerts ?? []).find((entry) => entry.id === watchId)
        if (!item) return
        item.spaceId = spaceId
        item.agentUserId = agentUserId
      })
    } catch (error) {
      console.error("Photon could not open the conversation.", error)
      return `iMessage ${formatPhone(config.handle)} from this number. The reply comes back in that chat.`
    }
  }
  const text =
    watch.kind === "case"
      ? `Following ${watch.label}. A new public note on that case will text you here.`
      : `Following the ${watch.label} repository. A new note on that desk will text you here.`
  try {
    await sendText(config, {
      spaceId,
      senderId: agentUserId,
      text,
      idempotencyKey: `clonacase-follow-${watch.id}-${watch.phone}`,
    })
  } catch (error) {
    console.error("Photon confirmation did not send.", error)
    return `iMessage ${formatPhone(config.handle)} from this number. The reply comes back in that chat.`
  }
  return "Following. The reply comes back in that iMessage chat."
}

async function chatFor(config: PhotonConfig, watch: { id: string; phone: string; spaceId: string; agentUserId: string }) {
  if (watch.spaceId && watch.agentUserId) return { spaceId: watch.spaceId, agentUserId: watch.agentUserId }
  try {
    const opened = await openConversation(config, watch.phone)
    await updateStore((store) => {
      for (const item of store.alerts ?? []) {
        if (item.phone !== watch.phone) continue
        item.spaceId = opened.spaceId
        item.agentUserId = opened.agentUserId
      }
    })
    return opened
  } catch (error) {
    console.error("Photon could not open the subscriber chat.", error)
    return null
  }
}

export function watchesForRoom<T extends { kind: string; targetId: string }>(
  room: { id: string; caseId: string; visibility: string },
  alerts: T[],
) {
  return alerts.filter((watch) => {
    if (watch.kind === "repository") return watch.targetId === room.id
    return watch.kind === "case" && watch.targetId === room.caseId && room.visibility === "public"
  })
}

export async function notifyDesk(input: { roomId: string; authorId: string; kind: string; title: string; eventId: string }) {
  const config = photonConfig()
  if (!config) return
  const store = await readStore()
  const room = store.clones.find((clone) => clone.id === input.roomId)
  if (!room) return
  const file = caseById(room.caseId)
  const label = file?.name ?? "a case"
  const watches = watchesForRoom(room, store.alerts ?? [])
  if (!watches.length) return
  const noun = input.kind === "media" ? "New source" : input.kind === "hypothetical" ? "New hypothetical event" : "New note"
  const where = room.visibility === "public" ? "a public repository" : "this repository"
  const text = `${label}: ${noun} on ${where}. ${cleanTitle(input.title)}. ${SITE}/repository/${room.id}`
  const seen = new Set<string>()
  for (const watch of watches) {
    if (seen.has(watch.phone)) continue
    const chat = await chatFor(config, watch)
    if (!chat) continue
    try {
      await sendText(config, {
        spaceId: chat.spaceId,
        senderId: chat.agentUserId,
        text,
        idempotencyKey: `clonacase-alert-${input.eventId}-${watch.id}`,
      })
      seen.add(watch.phone)
    } catch (error) {
      console.error("Photon alert did not send.", error)
    }
  }
}
