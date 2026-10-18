import Link from "next/link"
import { logout } from "@/lib/actions"
import { NoticeLink } from "@/components/notice-link"
import type { PublicUser } from "@/lib/types"

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="mark size-[30px] overflow-visible" aria-hidden="true">
      <defs>
        <filter id="mark-glow" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="0.7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g className="mark-lead">
        <path d="M18.51 7.25A9.1 9.1 0 0 1 25.01 17.27" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" opacity="0.34" />
        <path d="M18.51 7.25A9.1 9.1 0 0 1 25.01 17.27" fill="none" stroke="oklch(0.9 0.05 32)" strokeWidth="1.25" strokeLinecap="round" />
        <g className="mark-parent">
          <circle cx="25.01" cy="17.27" r="3.35" fill="oklch(0.75 0.14 24)" opacity="0.42" />
          <circle cx="25.01" cy="17.27" r="2.25" fill="oklch(0.97 0.02 70)" filter="url(#mark-glow)" />
        </g>
      </g>
      <g className="mark-chase">
        <path d="M7.82 19.99A9.1 9.1 0 0 1 10.91 8.46" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" opacity="0.34" />
        <path d="M7.82 19.99A9.1 9.1 0 0 1 10.91 8.46" fill="none" stroke="oklch(0.84 0.08 26)" strokeWidth="1.25" strokeLinecap="round" />
        <g className="mark-born">
          <circle cx="10.91" cy="8.46" r="2.9" fill="oklch(0.68 0.16 24)" opacity="0.4" />
          <circle cx="10.91" cy="8.46" r="1.85" fill="oklch(0.52 0.15 24)" filter="url(#mark-glow)" />
        </g>
      </g>
    </svg>
  )
}

export function Shell({ user, notices = 0 }: { user: PublicUser | null; notices?: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 w-full max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2 sm:px-5">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <Mark />
          <span className="font-heading text-lg tracking-tight lowercase">clonacase</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground sm:gap-2">
          <Link href="/cases" className="hidden rounded-md px-2 py-1 transition-colors hover:text-foreground sm:inline">
            Cases
          </Link>
          <Link href="/resources" className="rounded-md px-1.5 py-1 transition-colors hover:text-foreground sm:px-2">
            Resources
          </Link>
          {user ? <NoticeLink initial={notices} /> : null}
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
              <span className="inline-flex max-w-28 items-center gap-1.5 px-1 text-foreground sm:max-w-40">
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="truncate">{user.name}</span>
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
