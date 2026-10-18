"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cloneRecord } from "@/lib/actions"
import { Button } from "@/components/ui/button"

export function CloneCaseButton({ caseId, existingId }: { caseId: string; existingId?: string }) {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState("")

  if (existingId) {
    return (
      <Button render={<Link href={`/repository/${existingId}`} />} className="h-11 px-5" nativeButton={false}>
        Your repository
      </Button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        className="h-11 px-5 transition-transform duration-300 hover:scale-[1.03]"
        disabled={leaving}
        onClick={() => {
          setError("")
          setLeaving(true)
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
          const started = performance.now()
          if (!reduce) window.dispatchEvent(new Event("clonacase:open"))
          const data = new FormData()
          data.set("caseId", caseId)
          void cloneRecord(data).then(async (result) => {
            if (!result?.roomId) {
              window.dispatchEvent(new Event("clonacase:cancel"))
              setLeaving(false)
              setError(result?.error || "The repository did not save.")
              return
            }
            const wait = reduce ? 0 : Math.max(0, 780 - (performance.now() - started))
            await new Promise((resolve) => setTimeout(resolve, wait))
            router.push(`/repository/${result.roomId}`)
          })
        }}
      >
        {leaving ? "Cloning…" : "Clone the case"}
      </Button>
      {error ? <p className="max-w-48 text-right text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
