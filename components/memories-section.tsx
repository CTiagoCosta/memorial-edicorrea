"use client"

import { useState } from "react"
import Image from "next/image"
import { edivaldoContent } from "@/content/edivaldo"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const MEMORY_PHOTOS = [
  "/assets/img/edi-instagram-2-full.png",
  "/assets/img/edi-instagram-3-full.png",
  "/assets/img/edi-instagram-1-full.png",
]

export function MemoriesSection() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  return (
    <section id="lembrancas" className="bg-sand-100 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-clay-600">Fragmentos de memória</p>
        <h2 className="mt-3 font-serif text-4xl leading-[0.98] text-foreground md:text-5xl">
          O que ele <em className="font-normal not-italic text-clay-600">amava.</em>
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {edivaldoContent.memories.map((memory, index) => (
            <article key={memory.title}>
              <button
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Abrir foto de ${memory.title}`}
                className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden"
              >
                <Image src={MEMORY_PHOTOS[index]} alt="" fill className="object-cover" />
              </button>
              <h3 className="mt-5 font-serif text-2xl text-foreground">{memory.title}</h3>
              <p className="mt-2 text-sm leading-6 text-foreground/60">{memory.text}</p>
            </article>
          ))}
        </div>
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          {selectedIndex !== null && (
            <div className="space-y-3">
              <DialogHeader>
                <DialogTitle className="sr-only">{edivaldoContent.memories[selectedIndex].title}</DialogTitle>
              </DialogHeader>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                <Image
                  src={MEMORY_PHOTOS[selectedIndex]}
                  alt=""
                  fill
                  className="object-contain"
                />
              </div>
              <div className="rounded-lg bg-background/90 p-4 text-center backdrop-blur">
                <h3 className="font-semibold text-foreground">{edivaldoContent.memories[selectedIndex].title}</h3>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
