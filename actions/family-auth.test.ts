import { beforeEach, describe, expect, it, vi } from "vitest"

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock("next/headers", () => ({
  cookies: () => cookieStore,
}))

vi.mock("../lib/auth/password", () => ({
  verifyPassword: vi.fn(),
}))

import { verifyPassword } from "../lib/auth/password"
import { loginFamily, logoutFamily } from "./family-auth"
import { SESSION_COOKIE_NAME } from "../lib/auth/session"

describe("loginFamily", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SESSION_SECRET = "test-secret"
    process.env.FAMILY_PASSWORD_HASH = "stored-hash"
  })

  it("sets the session cookie when the password matches the stored hash", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(true)
    const formData = new FormData()
    formData.set("password", "correct-password")

    const result = await loginFamily({ error: null }, formData)

    expect(verifyPassword).toHaveBeenCalledWith("correct-password", "stored-hash")
    expect(cookieStore.set).toHaveBeenCalledWith(expect.objectContaining({ name: SESSION_COOKIE_NAME, httpOnly: true }))
    expect(result.error).toBeNull()
  })

  it("returns an error and does not set a cookie when the password is wrong", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(false)
    const formData = new FormData()
    formData.set("password", "wrong-password")

    const result = await loginFamily({ error: null }, formData)

    expect(cookieStore.set).not.toHaveBeenCalled()
    expect(result.error).toBe("Senha incorreta.")
  })
})

describe("logoutFamily", () => {
  it("deletes the session cookie", async () => {
    await logoutFamily()
    expect(cookieStore.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME)
  })
})
