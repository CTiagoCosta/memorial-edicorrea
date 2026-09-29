import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Footer } from "./footer"

describe("Footer", () => {
  it("shows the name in memoriam", () => {
    render(<Footer />)
    expect(screen.getByText(/edivaldo alves corrêa júnior/i)).toBeInTheDocument()
  })

  it("links to the developer's contact channels", () => {
    render(<Footer />)
    expect(screen.getByRole("link", { name: /ctsctiago@gmail.com/i })).toHaveAttribute(
      "href",
      "mailto:ctsctiago@gmail.com",
    )
  })
})
