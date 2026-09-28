import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { RopingSection } from "./roping-section"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock("@/actions/gallery", () => ({
  listGalleryImages: vi.fn(),
  uploadGalleryImage: vi.fn(),
  deleteGalleryImage: vi.fn(),
}))

describe("RopingSection", () => {
  it("shows the Team Roping club name and an empty gallery state", () => {
    render(<RopingSection initialImages={[]} initialIsFamily={false} />)
    expect(screen.getByText("Team Roping")).toBeInTheDocument()
    expect(screen.getByText(/nenhuma foto foi adicionada ainda/i)).toBeInTheDocument()
  })
})
