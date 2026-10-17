import type { Metadata } from "next"
import { Fraunces, Geist_Mono, Outfit } from "next/font/google"
import { Shell } from "@/components/shell"
import { getCurrentUser } from "@/lib/current"
import "./globals.css"

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://clonacase.club"),
  title: {
    default: "Clonacase",
    template: "%s · Clonacase",
  },
  description: "A private room for a public case. Sourced timelines for demonstration files.",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  return (
    <html
      lang="en"
      className={`${display.variable} ${outfit.variable} ${mono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full">
        <Shell user={user} />
        {children}
      </body>
    </html>
  )
}
