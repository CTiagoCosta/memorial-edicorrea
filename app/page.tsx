import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { RopingSection } from "@/components/roping-section"
import { GallerySection } from "@/components/gallery-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { listGalleryImages } from "@/actions/gallery"
import { listTestimonials } from "@/actions/testimonials"
import { getFamilySession } from "@/lib/auth/get-family-session"

export default async function MemorialPage() {
  const [isFamily, generalImages, ropingImages, testimonials] = await Promise.all([
    getFamilySession(),
    listGalleryImages("GERAL"),
    listGalleryImages("ROPING"),
    listTestimonials(),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation isFamily={isFamily} />
      <HeroSection />
      <AboutSection />
      <RopingSection initialImages={ropingImages} initialIsFamily={isFamily} />
      <GallerySection
        id="galeria-familia"
        title="Galeria da Família"
        subtitle="Momentos com a família e os amigos"
        category="GERAL"
        addButtonLabel="Adicionar Foto"
        initialImages={generalImages}
        initialIsFamily={isFamily}
      />
      <TestimonialsSection initialTestimonials={testimonials} initialIsFamily={isFamily} />
      <Footer />
    </div>
  )
}
