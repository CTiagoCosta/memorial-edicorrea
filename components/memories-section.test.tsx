import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoriesSection } from "./memories-section"

describe("MemoriesSection", () => {
  it("shows a title for each memory", () => {
    render(<MemoriesSection />)
    expect(screen.getByText("O jeito de viver")).toBeInTheDocument()
    expect(screen.getByText("Amor pelo campo")).toBeInTheDocument()
    expect(screen.getByText("Team Roping")).toBeInTheDocument()
  })
})
