"use client"

import { useState } from "react"
import { Heart, Send, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  addTestimonial,
  deleteTestimonial,
  likeTestimonial,
  listTestimonials,
  type TestimonialDTO,
} from "@/actions/testimonials"
import { formatRelativeDate } from "@/lib/format"

interface TestimonialsSectionProps {
  initialTestimonials: TestimonialDTO[]
  initialIsFamily: boolean
}

function getSessionId(): string {
  if (typeof window === "undefined") return "server"
  let id = window.localStorage.getItem("edi-session-id")
  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem("edi-session-id", id)
  }
  return id
}

export function TestimonialsSection({ initialTestimonials, initialIsFamily }: TestimonialsSectionProps) {
  const [mural, setMural] = useState(initialTestimonials)
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setMural(await listTestimonials())
  }

  const handleAdd = async () => {
    if (!name.trim() || !message.trim()) return
    setPending(true)
    setError(null)

    try {
      const result = await addTestimonial(name, message)
      if (result.error) {
        setError(result.error)
        return
      }
      setName("")
      setMessage("")
      await refresh()
    } catch {
      setError("Não foi possível enviar sua mensagem. Tente novamente.")
    } finally {
      setPending(false)
    }
  }

  const handleLike = async (testimonialId: string) => {
    await likeTestimonial(testimonialId, getSessionId())
    await refresh()
  }

  const handleDelete = async (testimonialId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este depoimento? Essa ação não pode ser desfeita.")) {
      return
    }
    await deleteTestimonial(testimonialId)
    await refresh()
  }

  return (
    <section id="depoimentos" className="bg-campo-50 py-20 dark:bg-campo-950/40">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-center text-4xl font-bold text-foreground md:text-5xl">Mural de Depoimentos</h2>
        <p className="mb-12 text-center text-xl text-foreground/70">
          Qualquer amigo pode deixar uma mensagem — não precisa de senha.
        </p>

        <Card className="mb-8 border-0 bg-card shadow-lg">
          <CardContent className="space-y-3 p-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea
              placeholder="Compartilhe uma memória especial..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button className="w-full" onClick={handleAdd} disabled={pending}>
              <Send className="mr-2 h-4 w-4" /> Enviar Mensagem
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {mural.map((testimonial) => (
            <Card key={testimonial.id} className="border-0 bg-card shadow-md">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{testimonial.name}</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleLike(testimonial.id)}>
                      <Heart className="mr-1 h-4 w-4" /> {testimonial.likes}
                    </Button>
                    {initialIsFamily && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Excluir depoimento"
                        onClick={() => handleDelete(testimonial.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-foreground/80">{testimonial.message}</p>
                <p className="mt-2 text-xs text-foreground/50">{formatRelativeDate(testimonial.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
