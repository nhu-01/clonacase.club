import type { Metadata } from "next"
import { Rise } from "@/components/motion"
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
    detail: "The official adult posters in these cases. The photograph and PDF stay on this site.",
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
    <div className="relative mx-auto w-full max-w-3xl px-5 py-14">
      <div
        className="ember pointer-events-none absolute -top-8 right-0 h-56 w-56 rounded-full bg-primary/20 blur-3xl"
        aria-hidden="true"
      />
      <Rise>
        <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">Resources</p>
        <h1 className="mt-4 font-heading text-5xl leading-none font-light tracking-tight sm:text-6xl">
          Public tools for a public record<span className="text-primary">.</span>
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">
          These open published information. Bring a link back to your repository and mark where it came from.
          They are not a way to contact a family, name a suspect, or guess where someone is.
        </p>
      </Rise>
      <div className="spine-x mt-10 h-px bg-primary/80" style={{ animationDelay: "0.18s" }} />
      <ul>
        {tools.map((tool, index) => (
          <li key={tool.href} className="rise" style={{ animationDelay: `${0.28 + index * 0.07}s` }}>
            <SafeLink href={tool.href} className="resource-row group">
              <span className="pt-2 font-mono text-[11px] tracking-[0.18em] text-primary/70">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block font-heading text-3xl font-light tracking-tight transition-colors duration-300 group-hover:text-primary">
                  {tool.name}
                </span>
                <span className="mt-2 block text-sm leading-6 text-muted-foreground">{tool.detail}</span>
              </span>
              <svg viewBox="0 0 16 16" className="resource-mark mt-3 h-4 w-4 text-primary" aria-hidden="true">
                <path d="M4 12 12 4M7 4h5v5" fill="none" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              <span className="resource-rule" />
            </SafeLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
