import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@/actions/gallery", () => ({
  listGalleryImages: vi.fn().mockResolvedValue([]),
}))
vi.mock("@/actions/testimonials", () => ({
  listTestimonials: vi.fn().mockResolvedValue([]),
}))
vi.mock("@/lib/auth/get-family-session", () => ({
  getFamilySession: vi.fn().mockResolvedValue(false),
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}))

import MemorialPage from "./page"

describe("MemorialPage", () => {
  it("renders the hero, roping, gallery, and testimonials sections together", async () => {
    render(await MemorialPage())

    expect(screen.getByRole("heading", { name: /edivaldo junior/i })).toBeInTheDocument()
    expect(screen.getAllByText(/team roping/i).length).toBeGreaterThan(0)
    expect(screen.getByRole("heading", { name: /galeria da família/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /mural de depoimentos/i })).toBeInTheDocument()
  })
})
