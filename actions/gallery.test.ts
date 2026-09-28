import { beforeEach, describe, expect, it, vi } from "vitest"

const { prismaMock, cloudinaryMock } = vi.hoisted(() => ({
  prismaMock: {
    galleryImage: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
  cloudinaryMock: {
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
  },
}))

vi.mock("../lib/db/client", () => ({ prisma: prismaMock }))
vi.mock("../lib/cloudinary/server", () => ({
  getCloudinaryClient: () => cloudinaryMock,
  GALLERY_FOLDER: "memorial-edicorreia/gallery",
}))
vi.mock("../lib/auth/get-family-session", () => ({ getFamilySession: vi.fn() }))

import { getFamilySession } from "../lib/auth/get-family-session"
import { deleteGalleryImage, listGalleryImages, uploadGalleryImage } from "./gallery"

describe("listGalleryImages", () => {
  beforeEach(() => vi.clearAllMocks())

  it("maps rows for the given category", async () => {
    prismaMock.galleryImage.findMany.mockResolvedValue([
      {
        id: "1",
        title: "Laço em dupla",
        description: null,
        category: "ROPING",
        cloudinaryPublicId: "memorial-edicorreia/gallery/1",
        url: "https://res.cloudinary.com/demo/image/upload/1.jpg",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
    ])

    const result = await listGalleryImages("ROPING")

    expect(prismaMock.galleryImage.findMany).toHaveBeenCalledWith({
      where: { category: "ROPING" },
      orderBy: { createdAt: "desc" },
    })
    expect(result[0].url).toBe("https://res.cloudinary.com/demo/image/upload/1.jpg")
    expect(result[0].createdAt).toBe("2026-01-01T00:00:00.000Z")
  })
})

describe("uploadGalleryImage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)
    const formData = new FormData()
    formData.set("title", "Foto")
    formData.set("file", new File(["a"], "a.jpg", { type: "image/jpeg" }))

    const result = await uploadGalleryImage("GERAL", formData)

    expect(result.error).toBe("Não autorizado.")
    expect(cloudinaryMock.uploader.upload_stream).not.toHaveBeenCalled()
  })

  it("rejects a non-image file even when authorized", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    const formData = new FormData()
    formData.set("title", "Foto")
    formData.set("file", new File(["a"], "a.txt", { type: "text/plain" }))

    const result = await uploadGalleryImage("GERAL", formData)

    expect(result.error).toBe("Apenas arquivos de imagem são permitidos.")
    expect(cloudinaryMock.uploader.upload_stream).not.toHaveBeenCalled()
  })

  it("rejects a file over 4MB", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" })
    const formData = new FormData()
    formData.set("title", "Foto")
    formData.set("file", bigFile)

    const result = await uploadGalleryImage("GERAL", formData)

    expect(result.error).toBe("Arquivo muito grande. Máximo 4MB.")
    expect(cloudinaryMock.uploader.upload_stream).not.toHaveBeenCalled()
  })

  it("uploads and creates the record when valid and authorized", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    cloudinaryMock.uploader.upload_stream.mockImplementation((_options, callback) => {
      callback(null, { secure_url: "https://res.cloudinary.com/demo/image/upload/new.jpg" })
      return { end: vi.fn() }
    })
    prismaMock.galleryImage.create.mockResolvedValue({})

    // jsdom's File/Blob polyfill has no arrayBuffer(); the real Server Action
    // runs in Node, where the native File.arrayBuffer() works fine.
    const file = new File(["a"], "foto.jpg", { type: "image/jpeg" })
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => new Uint8Array([97]).buffer,
    })

    const formData = new FormData()
    formData.set("title", "Treino de laço")
    formData.set("description", "")
    formData.set("file", file)

    const result = await uploadGalleryImage("ROPING", formData)

    expect(prismaMock.galleryImage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ category: "ROPING", title: "Treino de laço" }),
      }),
    )
    expect(result.error).toBeNull()
  })
})

describe("deleteGalleryImage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)

    const result = await deleteGalleryImage("1")

    expect(result.error).toBe("Não autorizado.")
    expect(prismaMock.galleryImage.delete).not.toHaveBeenCalled()
  })

  it("returns an error when the image does not exist", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    prismaMock.galleryImage.findUnique.mockResolvedValue(null)

    const result = await deleteGalleryImage("missing")

    expect(result.error).toBe("Foto não encontrada.")
    expect(cloudinaryMock.uploader.destroy).not.toHaveBeenCalled()
  })

  it("removes from Cloudinary and the database when authorized", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    prismaMock.galleryImage.findUnique.mockResolvedValue({
      id: "1",
      cloudinaryPublicId: "memorial-edicorreia/gallery/1",
    })
    cloudinaryMock.uploader.destroy.mockResolvedValue({})
    prismaMock.galleryImage.delete.mockResolvedValue({})

    const result = await deleteGalleryImage("1")

    expect(cloudinaryMock.uploader.destroy).toHaveBeenCalledWith("memorial-edicorreia/gallery/1")
    expect(prismaMock.galleryImage.delete).toHaveBeenCalledWith({ where: { id: "1" } })
    expect(result.error).toBeNull()
  })
})
