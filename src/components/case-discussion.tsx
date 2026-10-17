"use client"

import { useActionState } from "react"
import { deleteThread, postThread } from "@/lib/actions"
import { formatWhen } from "@/lib/format"
import type { ActionState } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const initial: ActionState = {}

export type ThreadItem = {
  id: string
  body: string
  createdAt: string
  authorId: string
  authorName: string
}

export function CaseDiscussion({
  caseId,
  posts,
  userId,
}: {
  caseId: string
  posts: ThreadItem[]
  userId: string
}) {
  const [state, action, pending] = useActionState(postThread, initial)

  return (
    <section className="mt-14">
      <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">Thread</p>
      <h2 className="mt-3 font-heading text-4xl font-light">Discussion</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Talk about the public poster. Do not name a suspect, and do not post a private address or a family member who is not already on the poster.
      </p>
      {posts.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-primary/20 border-y border-primary/25">
          {posts.map((post) => (
            <li key={post.id} className="py-4">
              <p className="font-mono text-[11px] tracking-[0.14em] text-primary uppercase">
                {post.authorName} · {formatWhen(post.createdAt)}
              </p>
              <p className="mt-2 text-sm leading-6">{post.body}</p>
              {post.authorId === userId ? (
                <form action={deleteThread} className="mt-2">
                  <input type="hidden" name="caseId" value={caseId} />
                  <input type="hidden" name="postId" value={post.id} />
                  <button type="submit" className="text-xs text-muted-foreground underline decoration-primary/30 underline-offset-4">
                    Delete
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <form action={action} className="mt-6 grid gap-3">
        <input type="hidden" name="caseId" value={caseId} />
        <Textarea name="body" required maxLength={500} placeholder="A sourced observation about the public record" />
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-primary">Posted.</p> : null}
        <Button type="submit" disabled={pending} className="h-10 w-fit px-4">
          {pending ? "Posting…" : "Post to the thread"}
        </Button>
      </form>
    </section>
  )
}
