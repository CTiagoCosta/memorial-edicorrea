import { beforeEach, describe, expect, it, vi } from "vitest"

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

const headerStore = {
  get: vi.fn(),
}

vi.mock("next/headers", () => ({
  cookies: () => cookieStore,
  headers: () => headerStore,
}))

vi.mock("../lib/auth/password", () => ({
  verifyPassword: vi.fn(),
}))

import { verifyPassword } from "../lib/auth/password"
import { loginFamily, logoutFamily } from "./family-auth"
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "../lib/auth/session"

let ipCounter = 0

describe("loginFamily", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SESSION_SECRET = "test-secret"
    process.env.FAMILY_PASSWORD_HASH = "stored-hash"
    // A fresh IP per test keeps the rate limiter's shared, module-scoped
    // state from leaking between tests, without needing a reset hook.
    ipCounter += 1
    headerStore.get.mockReturnValue(`203.0.113.${ipCounter}`)
  })

  it("sets the session cookie when the password matches the stored hash", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(true)
    const formData = new FormData()
    formData.set("password", "correct-password")

    const result = await loginFamily({ error: null }, formData)

    expect(verifyPassword).toHaveBeenCalledWith("correct-password", "stored-hash")
    expect(cookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: SESSION_COOKIE_NAME, httpOnly: true, maxAge: SESSION_MAX_AGE_SECONDS }),
    )
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

  it("blocks further attempts from the same IP after too many failures, even with the right password", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(false)
    const wrongAttempt = new FormData()
    wrongAttempt.set("password", "wrong-password")

    for (let i = 0; i < 5; i += 1) {
      await loginFamily({ error: null }, wrongAttempt)
    }

    vi.mocked(verifyPassword).mockResolvedValue(true)
    const correctAttempt = new FormData()
    correctAttempt.set("password", "correct-password")

    const result = await loginFamily({ error: null }, correctAttempt)

    expect(result.error).toBe("Muitas tentativas. Aguarde alguns minutos e tente novamente.")
    expect(cookieStore.set).not.toHaveBeenCalled()
  })
})

describe("logoutFamily", () => {
  it("deletes the session cookie", async () => {
    await logoutFamily()
    expect(cookieStore.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME)
  })
})
