import { describe, expect, it } from "vitest"
import { hashPassword, verifyPassword } from "./password"

describe("password hashing", () => {
  it("verifies a password against its own hash", async () => {
    const hash = await hashPassword("senha-da-familia")
    expect(await verifyPassword("senha-da-familia", hash)).toBe(true)
  })

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("senha-da-familia")
    expect(await verifyPassword("senha-errada", hash)).toBe(false)
  })
})
