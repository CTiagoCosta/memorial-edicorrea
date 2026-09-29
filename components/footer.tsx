import { Globe, Leaf, Mail, MessageCircle } from "lucide-react"
import { edivaldoContent } from "@/content/edivaldo"

const DEVELOPER_CONTACT = {
  whatsapp: { href: "https://wa.me/5567992825522", label: "(67) 99282-5522" },
  email: { href: "mailto:ctsctiago@gmail.com", label: "ctsctiago@gmail.com" },
  site: { href: "https://www.tiagocostadev.com.br/", label: "tiagocostadev.com.br" },
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-sand-100 py-12">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Leaf className="h-6 w-6 text-clay-600" />
          <span className="font-serif text-2xl text-foreground">{edivaldoContent.name}</span>
        </div>
        <p className="mx-auto mb-4 max-w-xl italic text-foreground/60">&quot;{edivaldoContent.tagline}&quot;</p>
        <div className="mb-6 text-xs uppercase tracking-[0.2em] text-foreground/40">
          Memorial criado com amor pela família e pelos amigos
        </div>

        <div className="mx-auto max-w-md border-t border-border pt-6">
          <p className="mb-3 text-xs text-foreground/40">Quer um memorial digital como este para sua família?</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground/70">
            <a
              href={DEVELOPER_CONTACT.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-clay-600"
            >
              <MessageCircle className="h-4 w-4" />
              {DEVELOPER_CONTACT.whatsapp.label}
            </a>
            <a
              href={DEVELOPER_CONTACT.email.href}
              className="flex items-center gap-1.5 transition-colors hover:text-clay-600"
            >
              <Mail className="h-4 w-4" />
              {DEVELOPER_CONTACT.email.label}
            </a>
            <a
              href={DEVELOPER_CONTACT.site.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-clay-600"
            >
              <Globe className="h-4 w-4" />
              {DEVELOPER_CONTACT.site.label}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
