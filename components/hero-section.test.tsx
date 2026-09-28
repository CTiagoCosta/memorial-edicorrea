import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { HeroSection } from "./hero-section"

describe("HeroSection", () => {
  it("shows the name, nickname, years and tagline", () => {
    render(<HeroSection />)
    expect(screen.getByRole("heading", { name: /edivaldo junior/i })).toBeInTheDocument()
    expect(screen.getByText(/"edi"/i)).toBeInTheDocument()
    expect(screen.getByText("1999 – 2026")).toBeInTheDocument()
  })

  it("links to the family gallery section", () => {
    render(<HeroSection />)
    expect(screen.getByRole("link", { name: /ver galeria da família/i })).toHaveAttribute("href", "#galeria-familia")
  })
})
