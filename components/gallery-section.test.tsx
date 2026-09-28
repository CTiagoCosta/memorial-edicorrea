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

import { deleteGalleryImage, listGalleryImages, uploadGalleryImage } from "@/actions/gallery"

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

  it("shows an error and re-enables the form when the upload call itself rejects", async () => {
    const user = userEvent.setup()
    vi.mocked(uploadGalleryImage).mockRejectedValueOnce(new Error("network down"))
    renderGallery({ initialImages: [], initialIsFamily: true })

    await user.click(screen.getByRole("button", { name: /adicionar foto/i }))
    await user.type(await screen.findByPlaceholderText(/título da foto/i), "Foto nova")

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["a"], "foto.jpg", { type: "image/jpeg" })
    await user.upload(fileInput, file)

    const publishButton = screen.getByRole("button", { name: /publicar foto/i })
    await user.click(publishButton)

    expect(await screen.findByRole("alert")).toHaveTextContent(/não foi possível publicar/i)
    expect(publishButton).not.toBeDisabled()
  })

  it("asks for confirmation before deleting a photo, and does nothing if declined", async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false)
    renderGallery({ initialIsFamily: true })

    await user.click(screen.getByRole("button", { name: /excluir foto/i }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(deleteGalleryImage).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it("deletes the photo when the confirmation is accepted", async () => {
    const user = userEvent.setup()
    vi.spyOn(window, "confirm").mockReturnValue(true)
    vi.mocked(deleteGalleryImage).mockResolvedValue({ error: null })
    vi.mocked(listGalleryImages).mockResolvedValue([])
    renderGallery({ initialIsFamily: true })

    await user.click(screen.getByRole("button", { name: /excluir foto/i }))

    expect(deleteGalleryImage).toHaveBeenCalledWith("1")
    vi.restoreAllMocks()
  })
})
