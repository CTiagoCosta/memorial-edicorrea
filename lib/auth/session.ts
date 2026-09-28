import { createHmac, timingSafeEqual } from "node:crypto"

export const SESSION_COOKIE_NAME = "edi_family_session"

const PAYLOAD = "family-authorized"

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error("Missing environment variable: SESSION_SECRET")
  }
  return secret
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex")
}

export function signSession(): string {
  const signature = sign(PAYLOAD, getSecret())
  return `${PAYLOAD}.${signature}`
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false

  const separatorIndex = token.lastIndexOf(".")
  if (separatorIndex === -1) return false

  const payload = token.slice(0, separatorIndex)
  const signature = token.slice(separatorIndex + 1)
  if (payload !== PAYLOAD) return false

  let expectedSignature: string
  try {
    expectedSignature = sign(payload, getSecret())
  } catch {
    return false
  }

  const expected = Buffer.from(expectedSignature)
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length) return false

  return timingSafeEqual(expected, actual)
}
