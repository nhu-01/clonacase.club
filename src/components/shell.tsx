import Link from "next/link"
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

export function Shell({ user }: { user: PublicUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <span className="text-primary">
            <Mark />
          </span>
          <span className="font-heading text-lg tracking-tight">Clonacase</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground sm:gap-2">
          <Link href="/archive" className="rounded-md px-2 py-1 transition-colors hover:text-foreground">
            Archive
          </Link>
          {user ? (
            <Link href="/rooms" className="rounded-md px-2 py-1 transition-colors hover:text-foreground">
              Rooms
            </Link>
          ) : (
            <Link href="/login" className="rounded-md px-2 py-1 transition-colors hover:text-foreground">
              Sign in
            </Link>
          )}
          {user ? (
            <form action={logout} className="flex items-center">
              <span className="hidden px-2 text-foreground/80 sm:inline">{user.name}</span>
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
