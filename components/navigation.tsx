"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Leaf, LogOut, Menu, Shield, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { logoutFamily } from "@/actions/family-auth"

const LINKS = [
  { href: "#home", label: "Início" },
  { href: "#sobre", label: "Sobre" },
  { href: "#team-roping", label: "Team Roping" },
  { href: "#galeria-familia", label: "Galeria da Família" },
  { href: "#depoimentos", label: "Depoimentos" },
]

interface NavigationProps {
  isFamily: boolean
}

export function Navigation({ isFamily: initialIsFamily }: NavigationProps) {
  const [isFamily, setIsFamily] = useState(initialIsFamily)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsFamily(initialIsFamily)
  }, [initialIsFamily])

  const handleLogout = async () => {
    await logoutFamily()
    setIsFamily(false)
    router.refresh()
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#home" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-clay-600/40 bg-clay-500/10 text-clay-600">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-serif text-lg text-foreground">Edi Correa</span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-foreground/70 transition-colors hover:text-clay-600">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isFamily && (
            <>
              <Badge variant="secondary" className="hidden sm:inline-flex bg-clay-500/15 text-clay-700">
                <Shield className="mr-1 h-3 w-3" /> Família
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1 h-3 w-3" /> Sair
              </Button>
            </>
          )}
          <button
            type="button"
            className="rounded-full border border-border p-2 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="flex flex-col gap-4 border-t border-border/60 px-4 py-5 text-sm md:hidden">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-foreground/80" onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
