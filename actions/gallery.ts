"use server"

import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/db/client"
import { getCloudinaryClient, GALLERY_FOLDER } from "@/lib/cloudinary/server"
import { getFamilySession } from "@/lib/auth/get-family-session"
import type { GalleryCategory } from "@prisma/client"

interface ActionResult {
  error: string | null
}

export interface GalleryImageDTO {
  id: string
  title: string
  description: string | null
  category: GalleryCategory
  url: string
  createdAt: string
}

interface GalleryImageRow {
  id: string
  title: string
  description: string | null
  category: GalleryCategory
  url: string
  createdAt: Date
}

// Kept under Vercel's hard 4.5MB Server Action request-body cap (see
// next.config.mjs's matching experimental.serverActions.bodySizeLimit).
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024

function mapImage(row: GalleryImageRow): GalleryImageDTO {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    url: row.url,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listGalleryImages(category: GalleryCategory): Promise<GalleryImageDTO[]> {
  const rows = await prisma.galleryImage.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(mapImage)
}

export async function uploadGalleryImage(category: GalleryCategory, formData: FormData): Promise<ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }

  const file = formData.get("file")
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()

  if (!(file instanceof File) || !title) {
    return { error: "Título e arquivo são obrigatórios." }
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Apenas arquivos de imagem são permitidos." }
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "Arquivo muito grande. Máximo 4MB." }
  }

  const cloudinary = getCloudinaryClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const publicId = randomUUID()

  const uploadResult = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ public_id: publicId, folder: GALLERY_FOLDER }, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error("Falha no upload para o Cloudinary"))
        return
      }
      resolve(result)
    })
    stream.end(buffer)
  })

  await prisma.galleryImage.create({
    data: {
      title,
      description: description || null,
      category,
      // Cloudinary combines `folder` + `public_id` into one final public_id
      // (e.g. "memorial-edicorreia/gallery/<uuid>"); destroy() needs that
      // full value, not the bare uuid we sent as input.
      cloudinaryPublicId: uploadResult.public_id,
      url: uploadResult.secure_url,
    },
  })

  return { error: null }
}

export async function deleteGalleryImage(imageId: string): Promise<ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }

  const image = await prisma.galleryImage.findUnique({ where: { id: imageId } })
  if (!image) {
    return { error: "Foto não encontrada." }
  }

  const cloudinary = getCloudinaryClient()
  await cloudinary.uploader.destroy(image.cloudinaryPublicId)
  await prisma.galleryImage.delete({ where: { id: imageId } })

  return { error: null }
}
