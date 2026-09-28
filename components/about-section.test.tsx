import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { AboutSection } from "./about-section"

describe("AboutSection", () => {
  it("shows the city, profession and bio text", () => {
    render(<AboutSection />)
    expect(screen.getByText(/guararapes - sp/i)).toBeInTheDocument()
    expect(screen.getByText(/eletricista — unesp/i)).toBeInTheDocument()
    expect(screen.getByText(/team roping/i)).toBeInTheDocument()
  })
})
