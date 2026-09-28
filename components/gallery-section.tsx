"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Camera, ImageIcon, Loader2, Lock, Plus, Send, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FamilyLoginDialog } from "@/components/family-login-dialog"
import { deleteGalleryImage, listGalleryImages, uploadGalleryImage, type GalleryImageDTO } from "@/actions/gallery"
import { formatRelativeDate } from "@/lib/format"
import type { GalleryCategory } from "@prisma/client"

interface GallerySectionProps {
  id: string
  title: string
  subtitle: string
  category: GalleryCategory
  addButtonLabel: string
  initialImages: GalleryImageDTO[]
  initialIsFamily: boolean
}

export function GallerySection({
  id,
  title,
  subtitle,
  category,
  addButtonLabel,
  initialImages,
  initialIsFamily,
}: GallerySectionProps) {
  const router = useRouter()
  const [images, setImages] = useState(initialImages)
  const [isFamily, setIsFamily] = useState(initialIsFamily)
  const [showLogin, setShowLogin] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [title_, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<GalleryImageDTO | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsFamily(initialIsFamily)
  }, [initialIsFamily])

  const refresh = async () => {
    setImages(await listGalleryImages(category))
  }

  const handleAddClick = () => {
    if (isFamily) {
      setShowUpload(true)
    } else {
      setShowLogin(true)
    }
  }

  const handlePublish = async () => {
    if (!file || !title_.trim()) return
    setPending(true)
    setError(null)

    const formData = new FormData()
    formData.set("title", title_.trim())
    formData.set("description", description.trim())
    formData.set("file", file)

    try {
      const result = await uploadGalleryImage(category, formData)
      if (result.error) {
        setError(result.error)
        return
      }

      setTitle("")
      setDescription("")
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      setShowUpload(false)
      await refresh()
    } catch {
      setError("Não foi possível publicar a foto. Tente novamente.")
    } finally {
      setPending(false)
    }
  }

  const handleDelete = async (imageId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta foto? Essa ação não pode ser desfeita.")) {
      return
    }
    await deleteGalleryImage(imageId)
    await refresh()
  }

  return (
    <section id={id} className="bg-background py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">{title}</h2>
          <p className="mb-8 text-xl text-foreground/70">{subtitle}</p>
          <Button onClick={handleAddClick}>
            {isFamily ? <Plus className="mr-2 h-5 w-5" /> : <Lock className="mr-2 h-5 w-5" />}
            {addButtonLabel}
          </Button>
        </div>

        {images.length === 0 && (
          <div className="py-12 text-center">
            <ImageIcon className="mx-auto mb-4 h-16 w-16 text-foreground/30" />
            <p className="text-lg text-foreground/50">Nenhuma foto foi adicionada ainda</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <Card key={image.id} className="group relative overflow-hidden border-0 shadow-lg">
              <button
                type="button"
                onClick={() => setSelectedImage(image)}
                className="relative block aspect-square w-full cursor-zoom-in"
              >
                <Image src={image.url} alt={image.title} fill className="object-cover" />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-4 text-left text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <h3 className="font-semibold">{image.title}</h3>
                  <p className="text-xs text-gray-200">{formatRelativeDate(image.createdAt)}</p>
                </div>
              </button>
              {isFamily && (
                <Button
                  variant="destructive"
                  size="sm"
                  aria-label="Excluir foto"
                  className="absolute right-2 top-2 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                  onClick={() => handleDelete(image.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" /> Adicionar Foto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Input placeholder="Título da foto *" value={title_} onChange={(e) => setTitle(e.target.value)} />
            <Textarea
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {file ? file.name : "Selecionar Arquivo"}
            </Button>
            <Button className="w-full" disabled={!file || !title_.trim() || pending} onClick={handlePublish}>
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Publicar Foto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          {selectedImage && (
            <div className="space-y-3">
              <DialogHeader>
                <DialogTitle className="sr-only">{selectedImage.title}</DialogTitle>
              </DialogHeader>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                <Image src={selectedImage.url} alt={selectedImage.title} fill className="object-contain" />
              </div>
              <div className="rounded-lg bg-background/90 p-4 text-center backdrop-blur">
                <h3 className="font-semibold text-foreground">{selectedImage.title}</h3>
                {selectedImage.description && (
                  <p className="mt-1 text-sm text-foreground/70">{selectedImage.description}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FamilyLoginDialog
        open={showLogin}
        onOpenChange={setShowLogin}
        onSuccess={() => {
          setIsFamily(true)
          setShowUpload(true)
          router.refresh()
        }}
      />
    </section>
  )
}
