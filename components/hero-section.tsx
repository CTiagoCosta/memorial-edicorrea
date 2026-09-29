import Image from "next/image"
import { Button } from "@/components/ui/button"
import { edivaldoContent } from "@/content/edivaldo"

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-end overflow-hidden px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pb-24"
    >
      <div className="absolute inset-0">
        <Image src={edivaldoContent.heroPhoto} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-campo-950/90 via-campo-950/70 to-campo-950/30" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-clay-400">Em memória, com amor</p>
        <h1 className="mt-6 font-serif text-4xl leading-[1.05] text-white md:text-6xl">{edivaldoContent.name}</h1>
        <p className="mt-4 text-xl text-clay-300">&quot;{edivaldoContent.nickname}&quot;</p>
        <p className="mt-1 text-white/60">{edivaldoContent.years}</p>
        <p className="mt-8 max-w-xl text-lg italic leading-relaxed text-white/80">{edivaldoContent.tagline}</p>
        <Button
          asChild
          size="lg"
          className="mt-10 rounded-full bg-clay-500 px-8 text-campo-950 shadow-lg hover:bg-clay-400"
        >
          <a href="#galeria-familia">Ver galeria da família</a>
        </Button>
      </div>
    </section>
  )
}
