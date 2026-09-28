import { beforeEach, describe, expect, it, vi } from "vitest"

const { prismaMock, txMock } = vi.hoisted(() => {
  const txMock = {
    $queryRaw: vi.fn(),
    testimonial: { update: vi.fn() },
  }
  return {
    txMock,
    prismaMock: {
      testimonial: {
        findMany: vi.fn(),
        create: vi.fn(),
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn((callback: (tx: typeof txMock) => unknown) => callback(txMock)),
    },
  }
})

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
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ])
  })

  it("never exposes the raw likedBy session ids publicly", async () => {
    prismaMock.testimonial.findMany.mockResolvedValue([
      { id: "1", name: "A", message: "B", likes: 1, likedBy: ["some-other-visitors-session-id"], createdAt: new Date() },
    ])

    const result = await listTestimonials()

    expect(result[0]).not.toHaveProperty("likedBy")
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

  it("rejects a non-string name or message instead of throwing, since Server Actions can be called with any payload", async () => {
    // @ts-expect-error deliberately calling with the wrong runtime type, as a
    // malicious client bypassing TypeScript would.
    const result = await addTestimonial(42, "mensagem")

    expect(result.error).toBe("Nome e mensagem são obrigatórios.")
    expect(prismaMock.testimonial.create).not.toHaveBeenCalled()
  })

  it("rejects a name longer than 80 characters", async () => {
    const result = await addTestimonial("a".repeat(81), "mensagem")

    expect(result.error).toBe("Nome muito longo. Máximo 80 caracteres.")
    expect(prismaMock.testimonial.create).not.toHaveBeenCalled()
  })

  it("rejects a message longer than 2000 characters", async () => {
    const result = await addTestimonial("Maria", "a".repeat(2001))

    expect(result.error).toBe("Mensagem muito longa. Máximo 2000 caracteres.")
    expect(prismaMock.testimonial.create).not.toHaveBeenCalled()
  })
})

const SESSION_A = "11111111-1111-4111-8111-111111111111"
const SESSION_B = "22222222-2222-4222-8222-222222222222"
const SESSION_C = "33333333-3333-4333-8333-333333333333"

describe("likeTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("locks the row inside a transaction before adding a like, avoiding a lost update", async () => {
    txMock.$queryRaw.mockResolvedValue([{ id: "1", likes: 1, likedBy: [] }])
    txMock.testimonial.update.mockResolvedValue({})

    const result = await likeTestimonial("1", SESSION_A)

    expect(prismaMock.$transaction).toHaveBeenCalled()
    expect(txMock.$queryRaw).toHaveBeenCalled()
    expect(txMock.testimonial.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { likes: 2, likedBy: [SESSION_A] },
    })
    expect(result.error).toBeNull()
  })

  it("removes the session and decrements likes when already liked among others", async () => {
    txMock.$queryRaw.mockResolvedValue([{ id: "1", likes: 3, likedBy: [SESSION_A, SESSION_B, SESSION_C] }])
    txMock.testimonial.update.mockResolvedValue({})

    const result = await likeTestimonial("1", SESSION_B)

    expect(txMock.testimonial.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { likes: 2, likedBy: [SESSION_A, SESSION_C] },
    })
    expect(result.error).toBeNull()
  })

  it("returns an error when the testimonial does not exist", async () => {
    txMock.$queryRaw.mockResolvedValue([])

    const result = await likeTestimonial("missing", SESSION_A)

    expect(result.error).toBe("Depoimento não encontrado.")
    expect(txMock.testimonial.update).not.toHaveBeenCalled()
  })

  it("rejects a sessionId that isn't a UUID, without touching the database", async () => {
    const result = await likeTestimonial("1", "not-a-real-uuid")

    expect(result.error).toBe("Sessão inválida.")
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })
})

describe("deleteTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)

    const result = await deleteTestimonial("1")

    expect(result.error).toBe("Não autorizado.")
    expect(prismaMock.testimonial.deleteMany).not.toHaveBeenCalled()
  })

  it("deletes when the family session is valid", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    prismaMock.testimonial.deleteMany.mockResolvedValue({ count: 1 })

    const result = await deleteTestimonial("1")

    expect(prismaMock.testimonial.deleteMany).toHaveBeenCalledWith({ where: { id: "1" } })
    expect(result.error).toBeNull()
  })

  it("returns an error instead of throwing when the testimonial does not exist", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    prismaMock.testimonial.deleteMany.mockResolvedValue({ count: 0 })

    const result = await deleteTestimonial("missing")

    expect(result.error).toBe("Depoimento não encontrado.")
  })
})
