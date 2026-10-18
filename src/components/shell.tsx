import Link from "next/link"
import { logout } from "@/lib/actions"
import { NoticeLink } from "@/components/notice-link"
import type { PublicUser } from "@/lib/types"

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="mark size-[30px] overflow-visible" aria-hidden="true">
      <defs>
        <filter id="mark-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.05" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path className="mark-floor" d="M5.4 24.2h21.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path className="mark-bloom" d="M7 24.2V15.2a9 9 0 0 1 18 0v9" pathLength="100" fill="none" stroke="currentColor" strokeWidth="5.2" strokeLinecap="round" />
      <path className="mark-trace" d="M7 24.2V15.2a9 9 0 0 1 18 0v9" pathLength="100" fill="none" stroke="oklch(0.86 0.09 28)" strokeWidth="1.35" strokeLinecap="round" filter="url(#mark-glow)" />
      <circle className="mark-halo" r="3.5" fill="oklch(0.72 0.16 24)" />
      <circle className="mark-rider" r="2.35" fill="oklch(0.95 0.03 60)" filter="url(#mark-glow)" />
      <circle className="mark-clone" cx="13.6" cy="19.7" r="2.7" fill="oklch(0.5 0.16 24)" filter="url(#mark-glow)" />
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
