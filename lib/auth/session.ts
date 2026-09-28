import { createHmac, timingSafeEqual } from "node:crypto"

export const SESSION_COOKIE_NAME = "edi_family_session"

const PAYLOAD_PREFIX = "family-authorized"

// A copied/leaked cookie (e.g. from a shared family computer) stays valid
// for at most this long. Rotating SESSION_SECRET also invalidates every
// existing session immediately, for a faster revoke if ever needed.
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000

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
  const expiresAt = Date.now() + SESSION_TTL_MS
  const payload = `${PAYLOAD_PREFIX}:${expiresAt}`
  const signature = sign(payload, getSecret())
  return `${payload}.${signature}`
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false

  const separatorIndex = token.lastIndexOf(".")
  if (separatorIndex === -1) return false

  const payload = token.slice(0, separatorIndex)
  const signature = token.slice(separatorIndex + 1)

  const [prefix, expiresAtRaw] = payload.split(":")
  if (prefix !== PAYLOAD_PREFIX) return false

  const expiresAt = Number(expiresAtRaw)
  if (!Number.isFinite(expiresAt)) return false

  let expectedSignature: string
  try {
    expectedSignature = sign(payload, getSecret())
  } catch {
    return false
  }

  const expected = Buffer.from(expectedSignature)
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length) return false
  if (!timingSafeEqual(expected, actual)) return false

  return Date.now() < expiresAt
}
