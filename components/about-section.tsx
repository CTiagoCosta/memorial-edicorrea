import { edivaldoContent } from "@/content/edivaldo"

export function AboutSection() {
  return (
    <section id="sobre" className="bg-background py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-center text-4xl font-bold text-foreground md:text-5xl">A história dele</h2>
        <p className="mb-4 text-center text-clay-600 dark:text-clay-300">
          {edivaldoContent.city} · {edivaldoContent.profession}
        </p>
        <p className="whitespace-pre-line text-lg leading-relaxed text-foreground/80">{edivaldoContent.bio}</p>
      </div>
    </section>
  )
}
