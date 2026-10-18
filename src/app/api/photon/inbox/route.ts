import { verifyPhotonWebhook } from "@/lib/agent-mind"
import { drainInbox, receiveText } from "@/lib/desk-agent"
import { inboundFrom, photonConfig } from "@/lib/photon"

export const dynamic = "force-dynamic"
export const maxDuration = 15

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const result = await drainInbox()
  return Response.json(result)
}

export async function POST(request: Request) {
  const raw = await request.text()
  const secret = process.env.PHOTON_WEBHOOK_SECRET
  if (!secret || !verifyPhotonWebhook(raw, request.headers, secret)) {
    return new Response("Unauthorized", { status: 401 })
  }
  let event: { type?: string; data?: { object?: unknown } }
  try {
    event = JSON.parse(raw) as { type?: string; data?: { object?: unknown } }
  } catch {
    return Response.json({ ok: true })
  }
  if (event.type !== "message.received") return Response.json({ ok: true })
  const config = photonConfig()
  const inbound = config ? inboundFrom(event.data?.object, config.handle) : null
  if (inbound) await receiveText(inbound)
  return Response.json({ ok: true })
}
