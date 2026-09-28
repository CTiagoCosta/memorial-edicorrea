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
  likedBy: string[]
  createdAt: string
}

interface TestimonialRow {
  id: string
  name: string
  message: string
  likes: number
  likedBy: string[]
  createdAt: Date
}

function mapTestimonial(row: TestimonialRow): TestimonialDTO {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    likes: row.likes,
    likedBy: row.likedBy,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listTestimonials(): Promise<TestimonialDTO[]> {
  const rows = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } })
  return rows.map(mapTestimonial)
}

export async function addTestimonial(name: string, message: string): Promise<ActionResult> {
  const trimmedName = name.trim()
  const trimmedMessage = message.trim()

  if (!trimmedName || !trimmedMessage) {
    return { error: "Nome e mensagem são obrigatórios." }
  }

  await prisma.testimonial.create({ data: { name: trimmedName, message: trimmedMessage } })
  return { error: null }
}

export async function likeTestimonial(testimonialId: string, sessionId: string): Promise<ActionResult> {
  const testimonial = await prisma.testimonial.findUnique({ where: { id: testimonialId } })
  if (!testimonial) {
    return { error: "Depoimento não encontrado." }
  }

  const alreadyLiked = testimonial.likedBy.includes(sessionId)
  const likedBy = alreadyLiked
    ? testimonial.likedBy.filter((id: string) => id !== sessionId)
    : [...testimonial.likedBy, sessionId]
  const likes = alreadyLiked ? testimonial.likes - 1 : testimonial.likes + 1

  await prisma.testimonial.update({ where: { id: testimonialId }, data: { likes, likedBy } })
  return { error: null }
}

export async function deleteTestimonial(testimonialId: string): Promise<ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }

  await prisma.testimonial.delete({ where: { id: testimonialId } })
  return { error: null }
}
