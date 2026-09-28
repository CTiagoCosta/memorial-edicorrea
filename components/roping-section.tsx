import { edivaldoContent } from "@/content/edivaldo"
import { GallerySection } from "@/components/gallery-section"
import type { GalleryImageDTO } from "@/actions/gallery"

interface RopingSectionProps {
  initialImages: GalleryImageDTO[]
  initialIsFamily: boolean
}

export function RopingSection({ initialImages, initialIsFamily }: RopingSectionProps) {
  return (
    <div className="bg-campo-50 dark:bg-campo-950/40">
      <div className="mx-auto max-w-3xl px-4 pt-20 text-center sm:px-6 lg:px-8">
        <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">{edivaldoContent.ropingClub}</h2>
        <p className="text-lg text-foreground/80">
          A paixão pelo laço em dupla e pela vida no campo, ao lado dos amigos do clube.
        </p>
      </div>
      <GallerySection
        id="team-roping"
        title="Fotos do Team Roping"
        subtitle="Treinos, competições e amigos do clube"
        category="ROPING"
        addButtonLabel="Adicionar Foto"
        initialImages={initialImages}
        initialIsFamily={initialIsFamily}
      />
    </div>
  )
}
