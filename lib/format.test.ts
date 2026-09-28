import { describe, expect, it } from "vitest"
import { formatRelativeDate } from "./format"

describe("formatRelativeDate", () => {
  it("formats a date from a week ago in weeks", () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeDate(eightDaysAgo)).toBe("2 semanas atrás")
  })

  it("falls back to a localized date for anything 30+ days old", () => {
    const old = new Date("2020-01-01T00:00:00Z").toISOString()
    expect(formatRelativeDate(old)).toBe(new Date(old).toLocaleDateString("pt-BR"))
  })
})
