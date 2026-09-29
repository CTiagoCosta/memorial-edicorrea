"use client"

import { useState } from "react"
import { Heart, Send, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

// Rough proxy for "won't fit in the 3-line clamp" — avoids measuring layout per card.
const LONG_MESSAGE_THRESHOLD = 140
const COLLAPSED_COUNT = 6

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
  const [expandedTestimonial, setExpandedTestimonial] = useState<TestimonialDTO | null>(null)
  const [showAll, setShowAll] = useState(false)

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
    <section id="depoimentos" className="bg-sand-200 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-clay-600">Palavras que abraçam</p>
        <h2 className="mt-3 font-serif text-4xl leading-[0.98] text-foreground md:text-5xl">
          Quem conviveu, <em className="font-normal not-italic text-clay-600">lembra.</em>
        </h2>

        <div className="mt-12 grid items-stretch gap-5 md:grid-cols-3">
          {(showAll ? mural : mural.slice(0, COLLAPSED_COUNT)).map((testimonial) => (
            <Card
              key={testimonial.id}
              className="flex h-full flex-col rounded-none border-0 bg-background p-6 shadow-none"
            >
              <Heart className="mb-4 h-4 w-4 fill-clay-600 text-clay-600" />
              <div className="flex-1">
                <p className="line-clamp-3 break-words font-serif text-lg leading-snug text-foreground">
                  {testimonial.message}
                </p>
                {testimonial.message.length > LONG_MESSAGE_THRESHOLD && (
                  <button
                    type="button"
                    onClick={() => setExpandedTestimonial(testimonial)}
                    className="mt-2 w-fit text-xs font-semibold uppercase tracking-[0.12em] text-clay-700 hover:text-clay-600"
                  >
                    Ler depoimento completo
                  </button>
                )}
              </div>
              <p className="mt-4 text-xs text-foreground/50">{formatRelativeDate(testimonial.createdAt)}</p>
              <cite className="mt-1 block break-words text-xs not-italic uppercase tracking-[0.15em] text-foreground/50">
                {testimonial.name}
              </cite>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit gap-1.5 px-0 text-xs font-semibold uppercase tracking-[0.12em] text-clay-700 hover:bg-transparent hover:text-clay-600"
                  onClick={() => handleLike(testimonial.id)}
                >
                  <Heart className={testimonial.likes > 0 ? "h-4 w-4 fill-current" : "h-4 w-4"} /> {testimonial.likes}
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
            </Card>
          ))}
        </div>

        {mural.length > COLLAPSED_COUNT && (
          <div className="mt-8 text-center">
            <Button variant="outline" className="rounded-full" onClick={() => setShowAll((current) => !current)}>
              {showAll ? "Ver menos" : `Ver todos os depoimentos (${mural.length})`}
            </Button>
          </div>
        )}

        <div className="mt-14 grid gap-8 border-t border-border pt-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-clay-600">Deixe sua lembrança</p>
            <h3 className="mt-3 font-serif text-3xl text-foreground">
              Uma palavra sua também faz parte da história.
            </h3>
            <p className="mt-3 text-sm leading-6 text-foreground/60">
              Qualquer amigo pode deixar uma mensagem — não precisa de senha.
            </p>
          </div>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Input
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-border bg-background focus-visible:border-clay-600"
            />
            <Textarea
              placeholder="Compartilhe uma memória especial..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border-border bg-background focus-visible:border-clay-600"
            />
            <Button
              className="w-fit rounded-full bg-campo-700 text-white hover:bg-campo-800"
              onClick={handleAdd}
              disabled={pending}
            >
              <Send className="mr-2 h-4 w-4" /> Enviar Mensagem
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!expandedTestimonial} onOpenChange={(open) => !open && setExpandedTestimonial(null)}>
        <DialogContent className="max-h-[80vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto">
          {expandedTestimonial && (
            <>
              <DialogHeader className="min-w-0">
                <DialogTitle className="font-serif text-2xl font-normal">{expandedTestimonial.name}</DialogTitle>
              </DialogHeader>
              <p className="min-w-0 whitespace-pre-line break-words text-foreground/80">
                {expandedTestimonial.message}
              </p>
              <p className="text-xs text-foreground/50">{formatRelativeDate(expandedTestimonial.createdAt)}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
