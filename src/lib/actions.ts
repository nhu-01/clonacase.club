"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { composeBrief } from "@/lib/brief"
import { getCurrentUser } from "@/lib/current"
import { isHttpUrl, isInternalPath, safeNext } from "@/lib/format"
import { clearSession, demoIdentity, setSession } from "@/lib/session"
import {
  caseById,
  getRoom,
  newId,
  updateStore,
} from "@/lib/store"
import { washingtonById } from "@/lib/washington-public"
import type { ActionState, ConnectionType, Milestone, MilestoneKind } from "@/lib/types"

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
  revalidatePath(`/room/${roomId}`)
  revalidatePath(`/repository/${roomId}`)
  if (caseId) {
    revalidatePath(`/cases/${caseId}`)
    revalidatePath(`/records/${caseId}`)
  }
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = text(formData, "email", 120)
  const password = String(formData.get("password") ?? "")
  const given = text(formData, "name", 40)
  if (!email || !password) return { error: "Type an email and a password. Any made-up pair is enough." }
  const name = given || email.split("@")[0] || "guest"
  await setSession(demoIdentity(name, email))
  redirect(safeNext(formData.get("next")))
}

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = text(formData, "name", 40)
  const email = text(formData, "email", 120)
  const password = String(formData.get("password") ?? "")
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
    const existing = store.clones.find((clone) => clone.caseId === caseId && clone.ownerId === user.id)
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
      brief: null,
      note: "",
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

export async function cloneRecord(formData: FormData) {
  const user = await getCurrentUser()
  const caseId = text(formData, "caseId", 64)
  if (!user) redirect(`/join?next=/records/${caseId}`)
  if (!washingtonById(caseId)) return

  let roomId = ""
  await updateStore((store) => {
    const existing = store.clones.find((clone) => clone.caseId === caseId && clone.ownerId === user.id)
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
      brief: null,
      note: "",
    })
  })
  refresh(roomId, caseId)
  redirect(`/repository/${roomId}`)
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
  refresh(roomId, owned.room.caseFile.id)
  return { ok: true }
}

export async function updateEvidence(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const roomId = text(formData, "roomId", 40)
  const milestoneId = text(formData, "milestoneId", 40)
  const owned = await ownedRoom(roomId)
  if (!owned.room) return { error: owned.error }
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
  refresh(roomId, owned.room.caseFile.id)
  return { ok: true }
}

export async function deleteEvidence(formData: FormData) {
  const roomId = text(formData, "roomId", 40)
  const milestoneId = text(formData, "milestoneId", 40)
  const owned = await ownedRoom(roomId)
  if (!owned.room) return
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
