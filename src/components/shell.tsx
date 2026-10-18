import Link from "next/link"
import { logout } from "@/lib/actions"
import { NoticeLink } from "@/components/notice-link"
import type { PublicUser } from "@/lib/types"

function Mark() {
  return (
    <svg viewBox="0 0 34 22" className="mark h-5 w-[34px] overflow-visible" aria-hidden="true">
      <path
        d="M 3 11 C 3 5 11.2 5 17 11 C 22.8 17 31 17 31 11 C 31 5 22.8 5 17 11 C 11.2 17 3 17 3 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <circle className="mark-flow" r="1.65" fill="oklch(0.94 0.025 70)" />
      <circle className="mark-echo" r="1.25" fill="oklch(0.74 0.12 24)" />
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
            <Link
              href="/profile"
              className="inline-flex max-w-28 items-center gap-1.5 rounded-md px-1 py-1 text-foreground transition-colors hover:text-primary sm:max-w-40"
            >
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="truncate">{user.name}</span>
            </Link>
          ) : null}
          {user ? (
            <form action={logout} className="flex items-center">
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
