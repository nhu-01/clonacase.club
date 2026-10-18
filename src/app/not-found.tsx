import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24">
      <p className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase">Missing page</p>
      <h1 className="mt-4 font-heading text-5xl font-light">That page is not among the cases.</h1>
      <Button render={<Link href="/archive" />} className="mt-8 h-10 px-4" nativeButton={false}>
        Return to cases
      </Button>
    </div>
  )
}
