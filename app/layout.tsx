import type { Metadata } from "next"
import { Fraunces, Inter } from "next/font/google"
import "./globals.css"

const heading = Fraunces({ subsets: ["latin"], variable: "--font-heading" })
const body = Inter({ subsets: ["latin"], variable: "--font-body" })

export const metadata: Metadata = {
  title: "Memorial Edivaldo Junior",
  description: "Em memória de Edivaldo Junior — Edi",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${heading.variable} ${body.variable}`}>{children}</body>
    </html>
  )
}
