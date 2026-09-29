"use client"

import { useState } from "react"
import { edivaldoContent } from "@/content/edivaldo"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function RopingSection() {
  const [showVideo, setShowVideo] = useState(false)

  return (
    <section id="team-roping" className="bg-campo-700 px-4 py-24 text-white sm:px-6 lg:px-8 lg:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-clay-400">Paixão e companheirismo</p>
          <h2 className="mt-4 font-serif text-4xl leading-[1.02] md:text-5xl">{edivaldoContent.ropingClub}</h2>
          <p className="mt-6 max-w-md leading-7 text-white/70">
            A paixão pelo laço em dupla e pela vida no campo, ao lado dos amigos de sempre.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowVideo(true)}
          aria-label="Abrir vídeo do Team Roping"
          className="relative aspect-video w-full cursor-zoom-in overflow-hidden"
        >
          <video
            src="/assets/img/edi-reel-1.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        </button>
      </div>

      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <DialogHeader>
            <DialogTitle className="sr-only">Vídeo do Team Roping</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
            <video
              src="/assets/img/edi-reel-1.mp4"
              controls
              autoPlay
              loop
              playsInline
              className="h-full w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
