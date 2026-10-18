"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { composeBrief } from "@/lib/brief"
import { getCurrentUser } from "@/lib/current"
import { isHttpUrl, isInternalPath, safeNext } from "@/lib/format"
import { clearSession, demoIdentity, setSession } from "@/lib/session"
import { posterBeats } from "@/lib/poster-beats"
import {
  authorName,
  caseById,
  getRoom,
  lastWriteDurable,
  newId,
  updateStore,
} from "@/lib/store"
import { washingtonById } from "@/lib/washington-public"
import type { ActionState, Clone, ConnectionType, HypotheticalEvent, MediaKind, Milestone, MilestoneKind, PullKind, RepoMedia } from "@/lib/types"

const KINDS: MilestoneKind[] = ["sourced", "lead", "inconclusive"]
const LINK_TYPES: ConnectionType[] = [
  "shared-associate",
  "overlapping-dates",
  "shared-route",
  "same-city",
]

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max)
}

function refresh(roomId: string, caseId?: string) {
  revalidatePath("/archive")
  revalidatePath("/rooms")
  revalidatePath("/pulls")
  revalidatePath("/", "layout")
  revalidatePath(`/room/${roomId}`)
  revalidatePath(`/repository/${roomId}`)
  if (caseId) {
    revalidatePath(`/cases/${caseId}`)
    revalidatePath(`/records/${caseId}`)
  }
}

function forkError(lineage: string | undefined) {
  if (lineage === "fork") return "This is a fork. Send a pull request instead of saving it on this desk."
  return ""
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = text(formData, "email", 120)
  const password = String(formData.get("gate") ?? formData.get("password") ?? "")
  const given = text(formData, "name", 40)
  if (!email || !password) return { error: "Type an email and a password. Any made-up pair is enough." }
  const name = given || email.split("@")[0] || "guest"
  await setSession(demoIdentity(name, email))
  redirect(safeNext(formData.get("next")))
}

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = text(formData, "name", 40)
  const email = text(formData, "email", 120)
  const password = String(formData.get("gate") ?? formData.get("password") ?? "")
  if (!name) return { error: "Choose a username. It does not have to be your real name." }
  if (!email || !password) return { error: "Type an email and a password. Any made-up pair is enough." }
  await setSession(demoIdentity(name, email))
  redirect(safeNext(formData.get("next")))
}

export async function logout() {
  await clearSession()
  redirect("/")
}

export async function cloneCase(formData: FormData) {
  const user = await getCurrentUser()
  const caseId = text(formData, "caseId", 40)
  if (!user) redirect(`/login?next=/cases/${caseId}`)
  const file = caseById(caseId)
  if (!file) return

  let roomId = ""
  await updateStore((store) => {
    const existing = store.clones.find(
      (clone) => clone.caseId === caseId && clone.ownerId === user.id && (clone.lineage ?? "original") === "original",
    )
    if (existing) {
      roomId = existing.id
      return
    }
    roomId = newId("room")
    store.clones.push({
      id: roomId,
      caseId,
      ownerId: user.id,
      visibility: "private",
      createdAt: new Date().toISOString(),
      milestones: [],
      media: [],
      hypothetical: [],
      brief: null,
      note: "",
      lineage: "original",
      sourceRoomId: "",
      sourceOwnerName: "",
    })
  })
  revalidatePath("/rooms")
  revalidatePath(`/cases/${caseId}`)
  redirect(`/room/${roomId}`)
}

function cleanUrl(value: string) {
  if (!value) return ""
  if (isInternalPath(value) || isHttpUrl(value)) return value
  return ""
}

export async function addMilestone(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Sign in to add a milestone." }
  const roomId = text(formData, "roomId", 40)
  const room = await getRoom(roomId, user.id)
  if (!room || room.locked || !room.canEdit) return { error: "This room is not open for notes." }

  const date = text(formData, "date", 10)
  const title = text(formData, "title", 140)
  const body = text(formData, "body", 800)
  const kind = text(formData, "kind", 20) as MilestoneKind
  const sourceLabel = text(formData, "sourceLabel", 180)
  const sourceUrl = cleanUrl(text(formData, "sourceUrl", 400))
  const rawImage = text(formData, "imageUrl", 400)
  const imageUrl = isHttpUrl(rawImage) ? rawImage : ""

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Choose a date." }
  if (title.length < 3) return { error: "Give the milestone a title." }
  if (!KINDS.includes(kind)) return { error: "Mark it sourced, a lead, or inconclusive." }
  if (kind === "sourced" && !sourceLabel) {
    return { error: "A sourced milestone needs the name of its source." }
  }
  if (rawImage && !imageUrl) return { error: "Image links need to start with http or https." }

  const milestone: Milestone = {
    id: newId("ms"),
    date,
    title,
    body,
    kind,
    sourceLabel,
    sourceUrl,
    imageUrl,
    authorId: user.id,
    createdAt: new Date().toISOString(),
    origin: "room",
  }

  await updateStore((store) => {
    const clone = store.clones.find((item) => item.id === roomId)
    if (!clone) return
    clone.milestones.push(milestone)
    clone.brief = null
  })
  refresh(roomId, room.caseFile.id)
  return { ok: true }
}

export async function postMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Sign in to write in this room." }
  const roomId = text(formData, "roomId", 40)
  const body = text(formData, "body", 500)
  const room = await getRoom(roomId, user.id)
  if (!room || room.locked) return { error: "This room is private." }
  if (body.length < 1) return { error: "Write a note first." }

  await updateStore((store) => {
    store.messages.push({
      id: newId("msg"),
      cloneId: roomId,
      authorId: user.id,
      body,
      createdAt: new Date().toISOString(),
      pinnedMilestoneId: null,
    })
  })
  refresh(roomId, room.caseFile.id)
  return { ok: true }
}

export async function pinMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Sign in to pin a note." }
  const roomId = text(formData, "roomId", 40)
  const messageId = text(formData, "messageId", 40)
  const room = await getRoom(roomId, user.id)
  if (!room || !room.canEdit) return { error: "This room is not open for notes." }

  const date = text(formData, "date", 10)
  const title = text(formData, "title", 140)
  const kind = text(formData, "kind", 20) as MilestoneKind
  const sourceLabel = text(formData, "sourceLabel", 180)
  const sourceUrl = cleanUrl(text(formData, "sourceUrl", 400))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Choose a date for the pin." }
  if (title.length < 3) return { error: "Give the pinned note a title." }
  if (!KINDS.includes(kind)) return { error: "Mark the pin sourced, a lead, or inconclusive." }
  if (kind === "sourced" && !sourceLabel) return { error: "A sourced pin needs a source." }

  const message = room.messages.find((item) => item.id === messageId)
  if (!message) return { error: "That note is gone." }
  if (message.pinnedMilestoneId) return { error: "That note is already on the timeline." }

  await updateStore((store) => {
    const clone = store.clones.find((item) => item.id === roomId)
    const note = store.messages.find((item) => item.id === messageId && item.cloneId === roomId)
    if (!clone || !note || note.pinnedMilestoneId) return
    const milestone: Milestone = {
      id: newId("ms"),
      date,
      title,
      body: note.body,
      kind,
      sourceLabel,
      sourceUrl,
      imageUrl: "",
      authorId: user.id,
      createdAt: new Date().toISOString(),
      origin: "room",
      pinnedFromMessageId: note.id,
    }
    clone.milestones.push(milestone)
    clone.brief = null
    note.pinnedMilestoneId = milestone.id
  })
  refresh(roomId, room.caseFile.id)
  return { ok: true }
}

export async function writeBrief(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Sign in to draft a brief." }
  const roomId = text(formData, "roomId", 40)
  const room = await getRoom(roomId, user.id)
  if (!room || room.locked || !room.canEdit) return { error: "This room cannot take a draft." }

  const brief = composeBrief(room.caseFile.name, room.milestones)
  await updateStore((store) => {
    const clone = store.clones.find((item) => item.id === roomId)
    if (!clone) return
    clone.brief = brief
  })
  refresh(roomId, room.caseFile.id)
  return { ok: true }
}

export async function setVisibility(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Sign in first." }
  const roomId = text(formData, "roomId", 40)
  const next = text(formData, "visibility", 10)
  const room = await getRoom(roomId, user.id)
  if (!room || room.clone.ownerId !== user.id) return { error: "Only the owner can change who sees this room." }

  if (next === "private") {
    await updateStore((store) => {
      const clone = store.clones.find((item) => item.id === roomId)
      if (clone) clone.visibility = "private"
    })
    refresh(roomId, room.caseFile.id)
    return { ok: true }
  }

  if (next !== "public") return { error: "Choose public or private." }
  if (room.clone.lineage === "fork") {
    return { error: "A fork stays private. Send a pull request to the original desk." }
  }
  const missing = room.milestones.filter((item) => item.kind === "sourced" && !item.sourceLabel.trim())
  if (missing.length > 0) {
    return { error: "Name a source on every sourced milestone before sharing." }
  }
  if (formData.get("acknowledge") !== "yes") {
    return { error: "Confirm that this room names no suspect." }
  }

  await updateStore((store) => {
    const clone = store.clones.find((item) => item.id === roomId)
    if (clone) clone.visibility = "public"
  })
  refresh(roomId, room.caseFile.id)
  return { ok: true }
}

export async function addConnection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Sign in to link files." }
  const roomId = text(formData, "roomId", 40)
  const otherId = text(formData, "otherId", 40)
  const type = text(formData, "type", 40) as ConnectionType
  const note = text(formData, "note", 600)
  const sourceLabel = text(formData, "sourceLabel", 180)
  const sourceUrl = cleanUrl(text(formData, "sourceUrl", 400))
  const room = await getRoom(roomId, user.id)
  if (!room || room.locked) return { error: "Open a room before linking files." }
  if (!LINK_TYPES.includes(type)) return { error: "Choose what kind of link this is." }
  if (note.length < 8) return { error: "Say what the link claims, in a sentence." }
  if (!sourceLabel) return { error: "A link needs a source." }
  const other = caseById(otherId)
  if (!other || other.id === room.caseFile.id) return { error: "Choose a different file." }

  const pair = [room.caseFile.id, other.id].sort().join(":")
  let error = ""
  await updateStore((store) => {
    const exists = store.connections.some((link) => {
      return [link.fromCaseId, link.toCaseId].sort().join(":") === pair
    })
    if (exists) {
      error = "Those files are already linked."
      return
    }
    store.connections.push({
      id: newId("link"),
      fromCaseId: room.caseFile.id,
      toCaseId: other.id,
      ownerId: user.id,
      type,
      note,
      sourceLabel,
      sourceUrl,
      confirmedBy: [],
      createdAt: new Date().toISOString(),
    })
  })
  if (error) return { error }
  refresh(roomId, room.caseFile.id)
  revalidatePath(`/cases/${other.id}`)
  return { ok: true }
}

async function confirmLink(formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Sign in to confirm a link." }
  const roomId = text(formData, "roomId", 40)
  const linkId = text(formData, "linkId", 40)

  let error = ""
  let caseIds: string[] = []
  await updateStore((store) => {
    const link = store.connections.find((item) => item.id === linkId)
    if (!link) {
      error = "That link is gone."
      return
    }
    caseIds = [link.fromCaseId, link.toCaseId]
    if (link.ownerId === user.id) {
      error = "Someone else has to confirm a link you created."
      return
    }
    if (link.confirmedBy.includes(user.id)) {
      error = "You already confirmed this link."
      return
    }
    link.confirmedBy.push(user.id)
  })
  if (error) return { error }
  revalidatePath("/archive")
  revalidatePath("/rooms")
  for (const caseId of caseIds) revalidatePath(`/cases/${caseId}`)
  if (roomId) revalidatePath(`/room/${roomId}`)
  return { ok: true }
}

export async function confirmConnection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return confirmLink(formData)
}

export async function confirmConnectionForm(formData: FormData) {
  await confirmLink(formData)
}

export async function cloneRecord(formData: FormData): Promise<{ roomId?: string; error?: string }> {
  const user = await getCurrentUser()
  const caseId = text(formData, "caseId", 64)
  if (!user) {
    redirect(`/join?next=/records/${caseId}`)
  }
  if (!washingtonById(caseId)) return { error: "That poster is not in the archive." }

  let roomId = ""
  await updateStore((store) => {
    const existing = store.clones.find(
      (clone) => clone.caseId === caseId && clone.ownerId === user.id && (clone.lineage ?? "original") === "original",
    )
    if (existing) {
      roomId = existing.id
      return
    }
    roomId = newId("room")
    store.clones.push({
      id: roomId,
      caseId,
      ownerId: user.id,
      visibility: "private",
      createdAt: new Date().toISOString(),
      milestones: [],
      media: [],
      hypothetical: [],
      brief: null,
      note: "",
      lineage: "original",
      sourceRoomId: "",
      sourceOwnerName: "",
    })
  })
  if (!roomId || !lastWriteDurable()) {
    return { error: "The repository did not save. The database refused the connection." }
  }
  refresh(roomId, caseId)
  return { roomId }
}

function readEvidence(formData: FormData) {
  const date = text(formData, "date", 10)
  const title = text(formData, "title", 140)
  const body = text(formData, "body", 800)
  const kind = text(formData, "kind", 20) as MilestoneKind
  const sourceLabel = text(formData, "sourceLabel", 180)
  const sourceUrl = cleanUrl(text(formData, "sourceUrl", 400))
  const rawImage = text(formData, "imageUrl", 400)
  const imageUrl = isHttpUrl(rawImage) ? rawImage : ""
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Choose a date." }
  if (title.length < 3) return { error: "Give the note a title." }
  if (!KINDS.includes(kind)) return { error: "Mark it sourced, a lead, or inconclusive." }
  if (kind === "sourced" && !sourceLabel) return { error: "A sourced note needs the name of its source." }
  if (rawImage && !imageUrl) return { error: "Media links need to start with http or https." }
  return { date, title, body, kind, sourceLabel, sourceUrl, imageUrl }
}

async function ownedRoom(roomId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Sign in to change this repository." as const, user: null, room: null }
  const room = await getRoom(roomId, user.id)
  if (!room || room.clone.ownerId !== user.id) {
    return { error: "Only the owner can change this repository." as const, user: null, room: null }
  }
  return { error: "", user, room }
}

export async function addEvidence(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const roomId = text(formData, "roomId", 40)
  const owned = await ownedRoom(roomId)
  if (!owned.user || !owned.room) return { error: owned.error }
  const blocked = forkError(owned.room.clone.lineage)
  if (blocked) return { error: blocked }
  const fields = readEvidence(formData)
  if ("error" in fields) return { error: fields.error }

  const milestone: Milestone = {
    id: newId("ms"),
    date: fields.date,
    title: fields.title,
    body: fields.body,
    kind: fields.kind,
    sourceLabel: fields.sourceLabel,
    sourceUrl: fields.sourceUrl,
    imageUrl: fields.imageUrl,
    authorId: owned.user.id,
    createdAt: new Date().toISOString(),
    origin: "room",
  }
  await updateStore((store) => {
    const clone = store.clones.find((item) => item.id === roomId)
    if (!clone) return
    clone.milestones.push(milestone)
    clone.brief = null
  })
  if (!lastWriteDurable()) return { error: "The note did not save." }
  refresh(roomId, owned.room.caseFile.id)
  return { ok: true }
}

export async function updateEvidence(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const roomId = text(formData, "roomId", 40)
  const milestoneId = text(formData, "milestoneId", 40)
  const owned = await ownedRoom(roomId)
  if (!owned.room) return { error: owned.error }
  const blocked = forkError(owned.room.clone.lineage)
  if (blocked) return { error: blocked }
  const fields = readEvidence(formData)
  if ("error" in fields) return { error: fields.error }

  await updateStore((store) => {
    const clone = store.clones.find((item) => item.id === roomId)
    const milestone = clone?.milestones.find((item) => item.id === milestoneId && item.origin === "room")
    if (!milestone) return
    milestone.date = fields.date
    milestone.title = fields.title
    milestone.body = fields.body
    milestone.kind = fields.kind
    milestone.sourceLabel = fields.sourceLabel
    milestone.sourceUrl = fields.sourceUrl
    milestone.imageUrl = fields.imageUrl
    if (clone) clone.brief = null
  })
  if (!lastWriteDurable()) return { error: "The note did not save." }
  refresh(roomId, owned.room.caseFile.id)
  return { ok: true }
}

export async function deleteEvidence(formData: FormData) {
  const roomId = text(formData, "roomId", 40)
  const milestoneId = text(formData, "milestoneId", 40)
  const owned = await ownedRoom(roomId)
  if (!owned.room || forkError(owned.room.clone.lineage)) return
  await updateStore((store) => {
    const clone = store.clones.find((item) => item.id === roomId)
    if (!clone) return
    clone.milestones = clone.milestones.filter((item) => item.id !== milestoneId)
    clone.brief = null
    for (const message of store.messages) {
      if (message.cloneId === roomId && message.pinnedMilestoneId === milestoneId) {
        message.pinnedMilestoneId = null
      }
    }
  })
  refresh(roomId, owned.room.caseFile.id)
}

export async function saveRepository(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const roomId = text(formData, "roomId", 40)
  const note = text(formData, "note", 2000)
  const owned = await ownedRoom(roomId)
  if (!owned.room) return { error: owned.error }
  await updateStore((store) => {
    const clone = store.clones.find((item) => item.id === roomId)
    if (clone) clone.note = note
  })
  refresh(roomId, owned.room.caseFile.id)
  return { ok: true }
}

export async function deleteRepository(formData: FormData) {
  const roomId = text(formData, "roomId", 40)
  if (formData.get("confirm") !== "yes") return
  const owned = await ownedRoom(roomId)
  if (!owned.room) return
  const caseId = owned.room.caseFile.id
  await updateStore((store) => {
    store.clones = store.clones.filter((item) => item.id !== roomId)
    store.messages = store.messages.filter((item) => item.cloneId !== roomId)
    store.pulls = (store.pulls ?? []).filter((item) => item.sourceRoomId !== roomId && item.targetRoomId !== roomId)
  })
  refresh(roomId, caseId)
  redirect("/rooms")
}

export async function postThread(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Sign in to join the thread." }
  const caseId = text(formData, "caseId", 64)
  const body = text(formData, "body", 500)
  if (!washingtonById(caseId)) return { error: "That poster is not in the archive." }
  if (body.length < 2) return { error: "Write a comment first." }
  await updateStore((store) => {
    store.threads.push({
      id: newId("thread"),
      caseId,
      authorId: user.id,
      body,
      createdAt: new Date().toISOString(),
    })
  })
  revalidatePath(`/records/${caseId}`)
  return { ok: true }
}

const MEDIA: MediaKind[] = ["article", "photo", "video", "pdf"]

function readMedia(formData: FormData) {
  const kind = text(formData, "kind", 20) as MediaKind
  const title = text(formData, "title", 140)
  const url = cleanUrl(text(formData, "url", 400))
  const note = text(formData, "note", 500)
  if (!MEDIA.includes(kind)) return { error: "Choose an article, photo, video, or PDF." }
  if (title.length < 2) return { error: "Give the media a title." }
  if (!url) return { error: "Paste a link that starts with http or https." }
  return { kind, title, url, note }
}

export async function addMedia(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const roomId = text(formData, "roomId", 40)
  const owned = await ownedRoom(roomId)
  if (!owned.user || !owned.room) return { error: owned.error }
  const blocked = forkError(owned.room.clone.lineage)
  if (blocked) return { error: blocked }
  const fields = readMedia(formData)
  if ("error" in fields) return { error: fields.error }
  const item: RepoMedia = {
    id: newId("media"),
    kind: fields.kind,
    title: fields.title,
    url: fields.url,
    note: fields.note,
    createdAt: new Date().toISOString(),
  }
  await updateStore((store) => {
    const clone = store.clones.find((entry) => entry.id === roomId)
    if (!clone) return
    if (!clone.media) clone.media = []
    clone.media.push(item)
  })
  if (!lastWriteDurable()) return { error: "The media did not save." }
  refresh(roomId, owned.room.caseFile.id)
  return { ok: true }
}

export async function deleteMedia(formData: FormData) {
  const roomId = text(formData, "roomId", 40)
  const mediaId = text(formData, "mediaId", 40)
  const owned = await ownedRoom(roomId)
  if (!owned.room || forkError(owned.room.clone.lineage)) return
  await updateStore((store) => {
    const clone = store.clones.find((entry) => entry.id === roomId)
    if (!clone?.media) return
    clone.media = clone.media.filter((item) => item.id !== mediaId)
  })
  refresh(roomId, owned.room.caseFile.id)
}

export async function updateMedia(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const roomId = text(formData, "roomId", 40)
  const mediaId = text(formData, "mediaId", 40)
  const owned = await ownedRoom(roomId)
  if (!owned.room) return { error: owned.error }
  const blocked = forkError(owned.room.clone.lineage)
  if (blocked) return { error: blocked }
  const fields = readMedia(formData)
  if ("error" in fields) return { error: fields.error }
  await updateStore((store) => {
    const item = store.clones.find((entry) => entry.id === roomId)?.media?.find((entry) => entry.id === mediaId)
    if (!item) return
    item.kind = fields.kind
    item.title = fields.title
    item.url = fields.url
    item.note = fields.note
  })
  if (!lastWriteDurable()) return { error: "The media did not save." }
  refresh(roomId, owned.room.caseFile.id)
  return { ok: true }
}

function readHypothetical(formData: FormData) {
  const date = text(formData, "date", 10)
  const title = text(formData, "title", 140)
  const body = text(formData, "body", 800)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Choose a date." }
  if (title.length < 3) return { error: "Give the event a title." }
  return { date, title, body }
}

export async function addHypothetical(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const roomId = text(formData, "roomId", 40)
  const owned = await ownedRoom(roomId)
  if (!owned.room) return { error: owned.error }
  const blocked = forkError(owned.room.clone.lineage)
  if (blocked) return { error: blocked }
  const fields = readHypothetical(formData)
  if ("error" in fields) return { error: fields.error }
  const event: HypotheticalEvent = { id: newId("hy"), date: fields.date, title: fields.title, body: fields.body, basedOn: "" }
  await updateStore((store) => {
    const clone = store.clones.find((entry) => entry.id === roomId)
    if (!clone) return
    if (!clone.hypothetical) clone.hypothetical = []
    clone.hypothetical.push(event)
  })
  if (!lastWriteDurable()) return { error: "The hypothetical event did not save." }
  refresh(roomId, owned.room.caseFile.id)
  return { ok: true }
}

export async function updateHypothetical(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const roomId = text(formData, "roomId", 40)
  const eventId = text(formData, "eventId", 40)
  const owned = await ownedRoom(roomId)
  if (!owned.room) return { error: owned.error }
  const blocked = forkError(owned.room.clone.lineage)
  if (blocked) return { error: blocked }
  const fields = readHypothetical(formData)
  if ("error" in fields) return { error: fields.error }
  await updateStore((store) => {
    const event = store.clones.find((entry) => entry.id === roomId)?.hypothetical?.find((entry) => entry.id === eventId)
    if (!event) return
    event.date = fields.date
    event.title = fields.title
    event.body = fields.body
  })
  if (!lastWriteDurable()) return { error: "The hypothetical event did not save." }
  refresh(roomId, owned.room.caseFile.id)
  return { ok: true }
}

export async function seedHypothetical(formData: FormData) {
  const roomId = text(formData, "roomId", 40)
  const owned = await ownedRoom(roomId)
  if (!owned.room || forkError(owned.room.clone.lineage)) return
  const record = washingtonById(owned.room.caseFile.id)
  if (!record) return
  const beats = posterBeats(record).filter((beat) => beat.kind !== "state_listing" && /^\d{4}-\d{2}-\d{2}$/.test(beat.sort))
  await updateStore((store) => {
    const clone = store.clones.find((entry) => entry.id === roomId)
    if (!clone || (clone.hypothetical ?? []).length > 0) return
    clone.hypothetical = beats.map((beat) => ({
      id: newId("hy"),
      date: beat.sort,
      title: beat.title,
      body: beat.body,
      basedOn: beat.title,
    }))
  })
  refresh(roomId, owned.room.caseFile.id)
}

export async function deleteHypothetical(formData: FormData) {
  const roomId = text(formData, "roomId", 40)
  const eventId = text(formData, "eventId", 40)
  const owned = await ownedRoom(roomId)
  if (!owned.room || forkError(owned.room.clone.lineage)) return
  await updateStore((store) => {
    const clone = store.clones.find((entry) => entry.id === roomId)
    if (!clone?.hypothetical) return
    clone.hypothetical = clone.hypothetical.filter((event) => event.id !== eventId)
  })
  refresh(roomId, owned.room.caseFile.id)
}

function copiedDesk(source: Clone) {
  return {
    milestones: (source.milestones ?? []).map((item) => ({ ...item, id: newId("ms") })),
    media: (source.media ?? []).map((item) => ({ ...item, id: newId("media") })),
    hypothetical: (source.hypothetical ?? []).map((item) => ({ ...item, id: newId("hy") })),
  }
}

async function takeRepository(
  formData: FormData,
  lineage: "cloned" | "fork",
): Promise<{ roomId?: string; error?: string }> {
  const user = await getCurrentUser()
  const roomId = text(formData, "roomId", 40)
  if (!user) redirect(`/login?next=/repository/${roomId}`)

  let created = ""
  let error = ""
  let caseId = ""
  await updateStore((store) => {
    const source = store.clones.find((item) => item.id === roomId)
    if (!source || source.visibility !== "public") {
      error = "That repository is not public."
      return
    }
    if (source.ownerId === user.id) {
      error = "This desk is already yours."
      return
    }
    const prior = store.clones.find(
      (item) => item.ownerId === user.id && item.sourceRoomId === source.id && item.lineage === lineage,
    )
    if (prior) {
      created = prior.id
      caseId = prior.caseId
      return
    }
    const name = authorName(store, source.ownerId)
    const copy = copiedDesk(source)
    created = newId("room")
    caseId = source.caseId
    store.clones.push({
      id: created,
      caseId: source.caseId,
      ownerId: user.id,
      visibility: "private",
      createdAt: new Date().toISOString(),
      milestones: copy.milestones,
      media: copy.media,
      hypothetical: copy.hypothetical,
      brief: null,
      note: lineage === "cloned" ? `Cloned from ${name}.` : `Forked from ${name}.`,
      lineage,
      sourceRoomId: source.id,
      sourceOwnerName: name,
    })
  })
  if (error) return { error }
  if (!created || !lastWriteDurable()) return { error: "The repository did not save." }
  refresh(created, caseId)
  return { roomId: created }
}

export async function cloneRepository(formData: FormData) {
  return takeRepository(formData, "cloned")
}

export async function forkRepository(formData: FormData) {
  return takeRepository(formData, "fork")
}

export async function submitPull(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Sign in to send a pull request." }
  if (formData.get("acknowledge") !== "yes") return { error: "Confirm that these notes name no suspect." }
  const roomId = text(formData, "roomId", 40)
  const pull = text(formData, "pull", 20) as PullKind
  if (pull !== "note" && pull !== "media" && pull !== "hypothetical") {
    return { error: "Choose a note, media, or a hypothetical event." }
  }

  let payload: { title: string; body: string; date: string; mediaKind: MediaKind | ""; url: string }
  if (pull === "note") {
    const fields = readEvidence(formData)
    if ("error" in fields) return { error: fields.error }
    payload = { title: fields.title, body: fields.body, date: fields.date, mediaKind: "", url: "" }
  } else if (pull === "media") {
    const fields = readMedia(formData)
    if ("error" in fields) return { error: fields.error }
    payload = { title: fields.title, body: fields.note, date: "", mediaKind: fields.kind, url: fields.url }
  } else {
    const fields = readHypothetical(formData)
    if ("error" in fields) return { error: fields.error }
    payload = { title: fields.title, body: fields.body, date: fields.date, mediaKind: "", url: "" }
  }

  let error = ""
  let caseId = ""
  let targetId = ""
  await updateStore((store) => {
    const fork = store.clones.find((item) => item.id === roomId)
    if (!fork || fork.ownerId !== user.id || fork.lineage !== "fork" || !fork.sourceRoomId) {
      error = "Only a fork can send a pull request."
      return
    }
    const target = store.clones.find((item) => item.id === fork.sourceRoomId)
    if (!target) {
      error = "The original repository is gone."
      return
    }
    if (!store.pulls) store.pulls = []
    store.pulls.push({
      id: newId("pull"),
      sourceRoomId: fork.id,
      targetRoomId: target.id,
      authorId: user.id,
      targetOwnerId: target.ownerId,
      caseId: fork.caseId,
      kind: pull,
      status: "open",
      createdAt: new Date().toISOString(),
      title: payload.title,
      body: payload.body,
      date: payload.date,
      mediaKind: payload.mediaKind,
      url: payload.url,
    })
    caseId = fork.caseId
    targetId = target.id
  })
  if (error) return { error }
  if (!lastWriteDurable()) return { error: "The pull request did not save." }
  refresh(roomId, caseId)
  if (targetId) revalidatePath(`/repository/${targetId}`)
  return { ok: true }
}

export async function acceptPull(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Sign in first." }
  const pullId = text(formData, "pullId", 40)
  let error = ""
  let caseId = ""
  let targetId = ""
  let sourceId = ""
  await updateStore((store) => {
    const pull = (store.pulls ?? []).find((item) => item.id === pullId)
    if (!pull || pull.targetOwnerId !== user.id) {
      error = "That pull request is not yours to accept."
      return
    }
    if (pull.status !== "open") {
      error = "That pull request is already closed."
      return
    }
    const target = store.clones.find((item) => item.id === pull.targetRoomId && item.ownerId === user.id)
    if (!target) {
      error = "The original repository is gone."
      return
    }
    if (pull.kind === "note") {
      target.milestones.push({
        id: newId("ms"),
        date: pull.date || new Date().toISOString().slice(0, 10),
        title: pull.title,
        body: pull.body,
        kind: "lead",
        sourceLabel: "",
        sourceUrl: "",
        imageUrl: "",
        authorId: pull.authorId,
        createdAt: new Date().toISOString(),
        origin: "room",
      })
      target.brief = null
    } else if (pull.kind === "media") {
      if (!target.media) target.media = []
      const kind = pull.mediaKind || "article"
      target.media.push({
        id: newId("media"),
        kind,
        title: pull.title,
        url: pull.url,
        note: pull.body,
        createdAt: new Date().toISOString(),
      })
    } else {
      if (!target.hypothetical) target.hypothetical = []
      target.hypothetical.push({
        id: newId("hy"),
        date: pull.date || new Date().toISOString().slice(0, 10),
        title: pull.title,
        body: pull.body,
        basedOn: "Pull request. A reading, not a finding.",
      })
    }
    pull.status = "accepted"
    caseId = pull.caseId
    targetId = target.id
    sourceId = pull.sourceRoomId
  })
  if (error) return { error }
  if (!lastWriteDurable()) return { error: "The pull request did not save." }
  if (targetId) refresh(targetId, caseId)
  if (sourceId) revalidatePath(`/repository/${sourceId}`)
  return { ok: true }
}

export async function declinePull(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: "Sign in first." }
  const pullId = text(formData, "pullId", 40)
  let error = ""
  let sourceId = ""
  let targetId = ""
  await updateStore((store) => {
    const pull = (store.pulls ?? []).find((item) => item.id === pullId)
    if (!pull || pull.targetOwnerId !== user.id) {
      error = "That pull request is not yours to decline."
      return
    }
    if (pull.status !== "open") {
      error = "That pull request is already closed."
      return
    }
    pull.status = "declined"
    sourceId = pull.sourceRoomId
    targetId = pull.targetRoomId
  })
  if (error) return { error }
  if (!lastWriteDurable()) return { error: "The pull request did not save." }
  revalidatePath("/pulls")
  revalidatePath("/", "layout")
  if (sourceId) revalidatePath(`/repository/${sourceId}`)
  if (targetId) revalidatePath(`/repository/${targetId}`)
  return { ok: true }
}

export async function deleteThread(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return
  const caseId = text(formData, "caseId", 64)
  const postId = text(formData, "postId", 40)
  await updateStore((store) => {
    store.threads = store.threads.filter(
      (post) => !(post.id === postId && post.caseId === caseId && post.authorId === user.id),
    )
  })
  revalidatePath(`/records/${caseId}`)
}
