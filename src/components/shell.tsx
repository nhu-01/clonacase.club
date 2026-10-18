import Link from "next/link"
import { UserRound } from "lucide-react"
import { logout } from "@/lib/actions"
import type { PublicUser } from "@/lib/types"

function Mark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M4.5 18.5V10.2a7.5 7.5 0 0 1 15 0v8.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M4 18.5h16" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function Shell({ user, notices = 0 }: { user: PublicUser | null; notices?: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 w-full max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2 sm:px-5">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <span className="text-primary">
            <Mark />
          </span>
          <span className="font-heading text-lg tracking-tight lowercase">clonacase</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground sm:gap-2">
          <Link href="/archive" className="hidden rounded-md px-2 py-1 transition-colors hover:text-foreground sm:inline">
            Cases
          </Link>
          <Link href="/resources" className="rounded-md px-1.5 py-1 transition-colors hover:text-foreground sm:px-2">
            Resources
          </Link>
          {user ? (
            <Link
              href="/pulls"
              aria-label={notices > 0 ? `PRs, ${notices} waiting` : "PRs"}
              className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:text-foreground sm:px-2"
            >
              PRs
              {notices > 0 ? (
                <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] leading-5 font-medium text-primary-foreground">
                  {notices}
                </span>
              ) : null}
            </Link>
          ) : null}
          {user ? (
            <Link href="/rooms" className="rounded-md px-1.5 py-1 transition-colors hover:text-foreground sm:px-2">
              Repository
            </Link>
          ) : (
            <Link href="/login" className="rounded-md px-1.5 py-1 transition-colors hover:text-foreground sm:px-2">
              Sign in
            </Link>
          )}
          {user ? (
            <form action={logout} className="flex items-center">
              <span className="grid size-7 place-items-center rounded-full border border-primary/45 text-primary" aria-label="Anonymous" title="Anonymous">
                <UserRound className="size-3.5" aria-hidden="true" />
              </span>
              <button
                type="submit"
                className="rounded-md px-2 py-1 transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
