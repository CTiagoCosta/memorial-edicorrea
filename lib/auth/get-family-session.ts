import { cookies } from "next/headers"
import { SESSION_COOKIE_NAME, verifySession } from "./session"

export async function getFamilySession(): Promise<boolean> {
  const cookieStore = await cookies()
  return verifySession(cookieStore.get(SESSION_COOKIE_NAME)?.value)
}
