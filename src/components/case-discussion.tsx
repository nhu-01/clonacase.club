"use client"

import { useEffect, useRef, useState } from "react"
import { useActionState } from "react"
import { deleteThread, postThread } from "@/lib/actions"
import type { ActionState } from "@/lib/types"
import { LocalWhen } from "@/components/local-when"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "cn"

const initial: ActionState = {}

export type ThreadItem = {
  id: string
  body: string
  createdAt: string
  authorId: string
  authorName: string
  parentId?: string
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
  const formRef = useRef<HTMLFormElement>(null)
  const { roots, children } = threadTree(posts)

  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state])

  return (
    <section className="mt-14">
      <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">Thread</p>
      <h2 className="mt-3 font-heading text-4xl font-light">Discussion</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Talk about the public poster. Do not name a suspect, and do not post a private address or a family member who is not already on the poster.
      </p>
      {roots.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-primary/20 border-y border-primary/25">
          {roots.map((post) => (
            <Comment key={post.id} post={post} childrenOf={children} caseId={caseId} userId={userId} depth={0} />
          ))}
        </ul>
      )}
      <form ref={formRef} action={action} className="mt-6 grid gap-3">
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

function Comment({
  post,
  childrenOf,
  caseId,
  userId,
  depth,
}: {
  post: ThreadItem
  childrenOf: Map<string, ThreadItem[]>
  caseId: string
  userId: string
  depth: number
}) {
  const replies = childrenOf.get(post.id) ?? []
  const mine = post.authorId === userId
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(postThread, initial)
  const box = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    box.current?.focus()
  }, [open])

  useEffect(() => {
    if (!state.ok) return
    setOpen(false)
  }, [state])

  return (
    <li className={depth === 0 ? "py-4" : ""}>
      <p className="font-mono text-[11px] tracking-[0.14em] text-primary uppercase">
        {post.authorName} · <LocalWhen iso={post.createdAt} />
      </p>
      <p className="mt-2 text-sm leading-6">{post.body}</p>
      <div className="mt-2 flex items-center gap-4">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="text-xs text-primary underline decoration-primary/30 underline-offset-4 transition-colors duration-200 hover:decoration-primary"
        >
          {open ? "Close" : "Reply"}
        </button>
        {mine ? (
          <form action={deleteThread}>
            <input type="hidden" name="caseId" value={caseId} />
            <input type="hidden" name="postId" value={post.id} />
            <button type="submit" className="text-xs text-muted-foreground underline decoration-primary/30 underline-offset-4 transition-colors duration-200 hover:text-foreground">
              Delete
            </button>
          </form>
        ) : null}
      </div>
      {open ? (
        <form action={action} className="reply-in mt-3 grid gap-2">
          <input type="hidden" name="caseId" value={caseId} />
          <input type="hidden" name="parentId" value={post.id} />
          <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            {mine ? "Replying to yourself" : `Replying to ${post.authorName}`}
          </p>
          <Textarea
            ref={box}
            name="body"
            required
            maxLength={500}
            placeholder={mine ? "Add to your own comment" : `Reply to ${post.authorName}`}
            className="min-h-16"
          />
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending} className="h-9 w-fit px-3">
            {pending ? "Replying…" : "Reply"}
          </Button>
        </form>
      ) : null}
      {replies.length > 0 ? (
        <ul className={cn("mt-4 grid gap-4", depth < 6 && "border-l border-primary/30 pl-4")}>
          {replies.map((reply) => (
            <Comment key={reply.id} post={reply} childrenOf={childrenOf} caseId={caseId} userId={userId} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function threadTree(posts: ThreadItem[]) {
  const ids = new Set(posts.map((post) => post.id))
  const children = new Map<string, ThreadItem[]>()
  const roots: ThreadItem[] = []
  for (const post of posts) {
    if (post.parentId && ids.has(post.parentId)) {
      const list = children.get(post.parentId) ?? []
      list.push(post)
      children.set(post.parentId, list)
    } else {
      roots.push(post)
    }
  }
  return { roots, children }
}
