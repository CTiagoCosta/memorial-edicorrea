import type { ComponentProps } from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GallerySection } from "./gallery-section"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock("@/actions/gallery", () => ({
  listGalleryImages: vi.fn(),
  uploadGalleryImage: vi.fn(),
  deleteGalleryImage: vi.fn(),
}))

const sampleImage = {
  id: "1",
  title: "Piquenique em família",
  description: null,
  category: "GERAL" as const,
  url: "https://cdn.test/family/1.jpg",
  createdAt: "2026-01-01T00:00:00Z",
}

function renderGallery(overrides: Partial<ComponentProps<typeof GallerySection>> = {}) {
  return render(
    <GallerySection
      id="galeria-familia"
      title="Galeria da Família"
      subtitle="Momentos em família"
      category="GERAL"
      addButtonLabel="Adicionar Foto"
      initialImages={[sampleImage]}
      initialIsFamily={false}
      {...overrides}
    />,
  )
}

describe("GallerySection", () => {
  it("renders the initial images passed from the server", () => {
    renderGallery()
    expect(screen.getByText("Piquenique em família")).toBeInTheDocument()
  })

  it("shows an empty state when there are no photos yet", () => {
    renderGallery({ initialImages: [] })
    expect(screen.getByText(/nenhuma foto foi adicionada ainda/i)).toBeInTheDocument()
  })

  it("prompts login instead of the upload form when not authenticated as family", async () => {
    const user = userEvent.setup()
    renderGallery({ initialImages: [] })

    await user.click(screen.getByRole("button", { name: /adicionar foto/i }))

    expect(await screen.findByText(/acesso da família/i)).toBeInTheDocument()
  })

  it("opens the upload form directly when already authenticated as family", async () => {
    const user = userEvent.setup()
    renderGallery({ initialImages: [], initialIsFamily: true })

    await user.click(screen.getByRole("button", { name: /adicionar foto/i }))

    expect(await screen.findByPlaceholderText(/título da foto/i)).toBeInTheDocument()
  })
})
