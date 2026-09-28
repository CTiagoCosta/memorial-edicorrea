"use server"

import { cookies } from "next/headers"
import { verifyPassword } from "@/lib/auth/password"
import { SESSION_COOKIE_NAME, signSession } from "@/lib/auth/session"

export interface LoginState {
  error: string | null
}

export async function loginFamily(_prevState: LoginState, formData: FormData): Promise<LoginState> {
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
  })

  return { error: null }
}

export async function logoutFamily(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
