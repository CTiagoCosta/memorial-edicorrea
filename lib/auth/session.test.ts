import { beforeEach, describe, expect, it } from "vitest"
import { SESSION_COOKIE_NAME, signSession, verifySession } from "./session"

describe("session signing", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret"
  })

  it("exposes a stable cookie name", () => {
    expect(SESSION_COOKIE_NAME).toBe("edi_family_session")
  })

  it("verifies a token produced by signSession", () => {
    const token = signSession()
    expect(verifySession(token)).toBe(true)
  })

  it("rejects an undefined token", () => {
    expect(verifySession(undefined)).toBe(false)
  })

  it("rejects a tampered token", () => {
    const token = signSession()
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a")
    expect(verifySession(tampered)).toBe(false)
  })

  it("rejects a token signed with a different secret", () => {
    const token = signSession()
    process.env.SESSION_SECRET = "different-secret"
    expect(verifySession(token)).toBe(false)
  })
})
