import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SESSION_COOKIE_NAME, signSession, verifySession } from "./session"

describe("session signing", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret"
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it("accepts a token within its expiry window", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))
    const token = signSession()

    vi.setSystemTime(new Date("2026-01-15T00:00:00Z"))
    expect(verifySession(token)).toBe(true)
  })

  it("rejects a token past its expiry, so a copied cookie can't be used forever", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))
    const token = signSession()

    vi.setSystemTime(new Date("2026-02-05T00:00:00Z"))
    expect(verifySession(token)).toBe(false)
  })
})
