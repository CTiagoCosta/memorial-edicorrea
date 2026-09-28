"use server"

import { prisma } from "@/lib/db/client"
import { getFamilySession } from "@/lib/auth/get-family-session"

interface ActionResult {
  error: string | null
}

export interface TestimonialDTO {
  id: string
  name: string
  message: string
  likes: number
  createdAt: string
}

interface TestimonialRow {
  id: string
  name: string
  message: string
  likes: number
  createdAt: Date
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_NAME_LENGTH = 80
const MAX_MESSAGE_LENGTH = 2000

// Never include the raw likedBy array here: it is a list of every liker's
// anonymous session id, and this DTO is returned to any visitor.
function mapTestimonial(row: TestimonialRow): TestimonialDTO {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    likes: row.likes,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listTestimonials(): Promise<TestimonialDTO[]> {
  const rows = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } })
  return rows.map(mapTestimonial)
}

export async function addTestimonial(name: string, message: string): Promise<ActionResult> {
  if (typeof name !== "string" || typeof message !== "string") {
    return { error: "Nome e mensagem são obrigatórios." }
  }

  const trimmedName = name.trim()
  const trimmedMessage = message.trim()

  if (!trimmedName || !trimmedMessage) {
    return { error: "Nome e mensagem são obrigatórios." }
  }
  if (trimmedName.length > MAX_NAME_LENGTH) {
    return { error: `Nome muito longo. Máximo ${MAX_NAME_LENGTH} caracteres.` }
  }
  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return { error: `Mensagem muito longa. Máximo ${MAX_MESSAGE_LENGTH} caracteres.` }
  }

  await prisma.testimonial.create({ data: { name: trimmedName, message: trimmedMessage } })
  return { error: null }
}

interface LockedTestimonialRow {
  id: string
  likes: number
  likedBy: string[]
}

export async function likeTestimonial(testimonialId: string, sessionId: string): Promise<ActionResult> {
  if (typeof sessionId !== "string" || !UUID_PATTERN.test(sessionId)) {
    return { error: "Sessão inválida." }
  }

  return prisma.$transaction(async (tx) => {
    // SELECT ... FOR UPDATE locks the row until this transaction commits, so a
    // second concurrent like/unlike waits and re-reads the just-committed
    // state instead of overwriting it (a lost update otherwise possible with
    // a plain read-then-write, since two visitors could both read the same
    // likedBy array before either write lands).
    const rows = await tx.$queryRaw<LockedTestimonialRow[]>`
      SELECT "id", "likes", "likedBy" FROM "Testimonial" WHERE "id" = ${testimonialId} FOR UPDATE
    `
    const testimonial = rows[0]
    if (!testimonial) {
      return { error: "Depoimento não encontrado." }
    }

    const alreadyLiked = testimonial.likedBy.includes(sessionId)
    const likedBy = alreadyLiked
      ? testimonial.likedBy.filter((id: string) => id !== sessionId)
      : [...testimonial.likedBy, sessionId]
    const likes = alreadyLiked ? testimonial.likes - 1 : testimonial.likes + 1

    await tx.testimonial.update({ where: { id: testimonialId }, data: { likes, likedBy } })
    return { error: null }
  })
}

export async function deleteTestimonial(testimonialId: string): Promise<ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }

  const { count } = await prisma.testimonial.deleteMany({ where: { id: testimonialId } })
  if (count === 0) {
    return { error: "Depoimento não encontrado." }
  }

  return { error: null }
}
