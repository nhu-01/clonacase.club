import type { Metadata } from "next"
import { SafeLink } from "@/components/safe-link"

export const metadata: Metadata = { title: "Resources" }

const tools = [
  {
    name: "OSINT Framework",
    href: "https://osintframework.com/",
    detail: "A public map of search starting points. Use it to find a published source, then save the link in your repository.",
  },
  {
    name: "Washington State Patrol missing persons",
    href: "https://wsp.wa.gov/crime/alerts-missing-persons/missing-persons/",
    detail: "The official adult posters in this archive. The photograph and PDF stay on this site.",
  },
  {
    name: "NamUs",
    href: "https://namus.nij.ojp.gov/",
    detail: "The national missing and unidentified persons system. Read the public record. Do not scrape it.",
  },
  {
    name: "Wayback Machine",
    href: "https://web.archive.org/",
    detail: "Older public copies of a news page or an agency page, when the live page has changed.",
  },
  {
    name: "Chronicling America",
    href: "https://chroniclingamerica.loc.gov/",
    detail: "Historic newspaper pages from the Library of Congress.",
  },
  {
    name: "Washington State Archives",
    href: "https://www.digitalarchives.wa.gov/",
    detail: "Public records the state archives have already released.",
  },
  {
    name: "Washington courts",
    href: "https://www.courts.wa.gov/",
    detail: "The court system’s own site for public case information. Use the portal the court provides.",
  },
]

export default function ResourcesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-14">
      <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">Resources</p>
      <h1 className="mt-4 font-heading text-5xl leading-none font-light tracking-tight sm:text-6xl">
        Public tools for a public record.
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
        These open published information. Bring a link back to your repository and mark where it came from.
        They are not a way to contact a family, name a suspect, or guess where someone is.
      </p>
      <ul className="mt-10 divide-y divide-primary/20 border-y border-primary/25">
        {tools.map((tool) => (
          <li key={tool.href} className="py-5">
            <SafeLink href={tool.href} className="font-heading text-3xl font-light hover:text-primary">
              {tool.name}
            </SafeLink>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
