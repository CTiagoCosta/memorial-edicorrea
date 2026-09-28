"use server"

import { cookies, headers } from "next/headers"
import { checkRateLimit } from "@/lib/auth/rate-limit"
import { verifyPassword } from "@/lib/auth/password"
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, signSession } from "@/lib/auth/session"

export interface LoginState {
  error: string | null
}

const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000

export async function loginFamily(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const headerStore = await headers()
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

  if (!checkRateLimit(ip, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MS)) {
    return { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }
  }

  const password = String(formData.get("password") ?? "")
  const storedHash = process.env.FAMILY_PASSWORD_HASH ?? ""

  const isValid = storedHash.length > 0 && (await verifyPassword(password, storedHash))
  if (!isValid) {
    return { error: "Senha incorreta." }
  }

  const cookieStore = await cookies()
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: signSession(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })

  return { error: null }
}

export async function logoutFamily(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
