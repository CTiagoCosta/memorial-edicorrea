import { edivaldoContent } from "@/content/edivaldo"

export function AboutSection() {
  return (
    <section
      id="sobre"
      className="mx-auto grid max-w-6xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20 lg:px-8 lg:py-32"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-clay-600">Um pouco dele</p>
        <h2 className="mt-4 font-serif text-4xl leading-[0.98] text-foreground md:text-5xl">
          A beleza de uma vida <em className="font-normal not-italic text-clay-600">vivida de verdade.</em>
        </h2>
      </div>
      <div className="space-y-6 text-lg leading-8 text-foreground/70">
        <p className="text-clay-600">
          {edivaldoContent.city} · {edivaldoContent.profession}
        </p>
        <p className="whitespace-pre-line">{edivaldoContent.bio}</p>
      </div>
    </section>
  )
}
