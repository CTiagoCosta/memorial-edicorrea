import Image from "next/image"
import { Button } from "@/components/ui/button"
import { edivaldoContent } from "@/content/edivaldo"

export function HeroSection() {
  return (
    <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0">
        <Image
          src={edivaldoContent.heroPhoto}
          alt={edivaldoContent.name}
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 h-40 w-40 overflow-hidden rounded-full border-4 border-clay-500 shadow-xl">
          <Image
            src={edivaldoContent.heroPhoto}
            alt={edivaldoContent.name}
            width={160}
            height={160}
            className="h-full w-full object-cover"
          />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-foreground md:text-5xl">{edivaldoContent.name}</h1>
        <p className="mb-1 text-xl text-clay-600 dark:text-clay-300">&quot;{edivaldoContent.nickname}&quot;</p>
        <p className="mb-8 text-foreground/70">{edivaldoContent.years}</p>
        <p className="mx-auto mb-10 max-w-xl text-lg italic text-foreground/80">{edivaldoContent.tagline}</p>
        <Button asChild size="lg" className="rounded-full bg-clay-500 px-8 text-white shadow-lg hover:bg-clay-600">
          <a href="#galeria-familia">Ver galeria da família</a>
        </Button>
      </div>
    </section>
  )
}
