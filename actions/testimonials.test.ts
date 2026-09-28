import { beforeEach, describe, expect, it, vi } from "vitest"

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    testimonial: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock("../lib/db/client", () => ({ prisma: prismaMock }))
vi.mock("../lib/auth/get-family-session", () => ({ getFamilySession: vi.fn() }))

import { getFamilySession } from "../lib/auth/get-family-session"
import { addTestimonial, deleteTestimonial, likeTestimonial, listTestimonials } from "./testimonials"

describe("listTestimonials", () => {
  beforeEach(() => vi.clearAllMocks())

  it("maps rows to the DTO shape", async () => {
    prismaMock.testimonial.findMany.mockResolvedValue([
      {
        id: "1",
        name: "Alguém do clube",
        message: "Saudade dos treinos juntos",
        likes: 2,
        likedBy: ["session-a"],
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
    ])

    const result = await listTestimonials()

    expect(prismaMock.testimonial.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } })
    expect(result).toEqual([
      {
        id: "1",
        name: "Alguém do clube",
        message: "Saudade dos treinos juntos",
        likes: 2,
        likedBy: ["session-a"],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ])
  })
})

describe("addTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects an empty name or message without touching the database", async () => {
    const result = await addTestimonial("  ", "mensagem")
    expect(result.error).toBe("Nome e mensagem são obrigatórios.")
    expect(prismaMock.testimonial.create).not.toHaveBeenCalled()
  })

  it("creates a trimmed testimonial when valid, without requiring a family session", async () => {
    prismaMock.testimonial.create.mockResolvedValue({})

    const result = await addTestimonial("  Maria  ", "  Com carinho  ")

    expect(prismaMock.testimonial.create).toHaveBeenCalledWith({
      data: { name: "Maria", message: "Com carinho" },
    })
    expect(result.error).toBeNull()
  })
})

describe("likeTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("adds the session and increments likes when not already liked", async () => {
    prismaMock.testimonial.findUnique.mockResolvedValue({ id: "1", likes: 1, likedBy: [] })
    prismaMock.testimonial.update.mockResolvedValue({})

    const result = await likeTestimonial("1", "session-a")

    expect(prismaMock.testimonial.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { likes: 2, likedBy: ["session-a"] },
    })
    expect(result.error).toBeNull()
  })

  it("removes the session and decrements likes when already liked among others", async () => {
    prismaMock.testimonial.findUnique.mockResolvedValue({
      id: "1",
      likes: 3,
      likedBy: ["session-a", "session-b", "session-c"],
    })
    prismaMock.testimonial.update.mockResolvedValue({})

    const result = await likeTestimonial("1", "session-b")

    expect(prismaMock.testimonial.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { likes: 2, likedBy: ["session-a", "session-c"] },
    })
    expect(result.error).toBeNull()
  })

  it("returns an error when the testimonial does not exist", async () => {
    prismaMock.testimonial.findUnique.mockResolvedValue(null)

    const result = await likeTestimonial("missing", "session-a")

    expect(result.error).toBe("Depoimento não encontrado.")
    expect(prismaMock.testimonial.update).not.toHaveBeenCalled()
  })
})

describe("deleteTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)

    const result = await deleteTestimonial("1")

    expect(result.error).toBe("Não autorizado.")
    expect(prismaMock.testimonial.delete).not.toHaveBeenCalled()
  })

  it("deletes when the family session is valid", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    prismaMock.testimonial.delete.mockResolvedValue({})

    const result = await deleteTestimonial("1")

    expect(prismaMock.testimonial.delete).toHaveBeenCalledWith({ where: { id: "1" } })
    expect(result.error).toBeNull()
  })
})
