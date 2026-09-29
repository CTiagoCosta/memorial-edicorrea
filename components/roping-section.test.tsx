import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RopingSection } from "./roping-section"

describe("RopingSection", () => {
  it("shows the Team Roping heading and video", () => {
    render(<RopingSection />)
    expect(screen.getByText("Team Roping")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /abrir vídeo do team roping/i })).toBeInTheDocument()
  })

  it("opens the video in a dialog when clicked", async () => {
    const user = userEvent.setup()
    render(<RopingSection />)
    await user.click(screen.getByRole("button", { name: /abrir vídeo do team roping/i }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})
