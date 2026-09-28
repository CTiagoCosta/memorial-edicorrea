import { describe, expect, it } from "vitest"
import { checkRateLimit } from "./rate-limit"

describe("checkRateLimit", () => {
  it("allows attempts up to the limit and blocks the next one", () => {
    const key = "key-a"
    expect(checkRateLimit(key, 3, 60_000)).toBe(true)
    expect(checkRateLimit(key, 3, 60_000)).toBe(true)
    expect(checkRateLimit(key, 3, 60_000)).toBe(true)
    expect(checkRateLimit(key, 3, 60_000)).toBe(false)
  })

  it("tracks separate keys independently", () => {
    expect(checkRateLimit("key-b", 1, 60_000)).toBe(true)
    expect(checkRateLimit("key-c", 1, 60_000)).toBe(true)
  })
})
