import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation((options) => ({ __options: options })),
}))
vi.mock("@prisma/adapter-neon", () => ({
  PrismaNeon: vi.fn().mockImplementation((options) => ({ __adapterOptions: options })),
}))

describe("prisma client", () => {
  beforeEach(() => {
    vi.resetModules()
    delete globalThis.prismaClient
    process.env.DATABASE_URL = "postgresql://test/test?sslmode=require"
  })

  it("throws a clear error when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL
    await expect(import("./client")).rejects.toThrow("Missing environment variable: DATABASE_URL")
  })

  it("builds a client backed by the Neon adapter when DATABASE_URL is set", async () => {
    const { prisma } = await import("./client")
    expect(prisma).toBeDefined()
  })
})
