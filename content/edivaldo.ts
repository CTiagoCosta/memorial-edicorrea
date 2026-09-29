export interface PersonContent {
  name: string
  nickname: string
  years: string
  heroPhoto: string
  tagline: string
  city: string
  profession: string
  ropingClub: string
  bio: string
  memories: MemoryContent[]
}

export interface MemoryContent {
  title: string
  text: string
}

export const edivaldoContent: PersonContent = {
  name: "Edivaldo Alves Corrêa Júnior",
  nickname: "Edi",
  years: "1999 – 2026",
  heroPhoto: "/assets/img/edi-hero.png",
  // TODO: aguardando uma frase ou lema marcante escolhido pela família —
  // não inventar um epitáfio.
  tagline: "Aguardando uma frase da família.",
  city: "Guararapes - SP",
  profession: "Engenheiro Eletricista — UNESP",
  // Não tinha clube: praticava Team Roping por conta própria, com os amigos.
  ropingClub: "Team Roping",
  bio: "Edi era engenheiro eletricista formado pela UNESP e vivia em Guararapes-SP. Nas horas livres, sua paixão era cavalgar e competir no Team Roping, sem clube, só com os amigos. Pra família era Juninho, pra irmã era Pelota, pros amigos era Soldado, pra gente e pros amigos daqui era Edi, em casa pros pais e pra irmã era chefão, e pra namorada, meu bem.",
  memories: [
    {
      title: "O jeito de viver",
      // TODO: aguardando uma lembrança da família sobre o jeito de ser do Edi — não inventar.
      text: "Aguardando uma lembrança da família.",
    },
    {
      title: "Amor pelo campo",
      // TODO: aguardando uma lembrança específica da família sobre as cavalgadas — não inventar.
      text: "Aguardando uma lembrança da família sobre as cavalgadas.",
    },
    {
      title: "Team Roping",
      // TODO: aguardando uma lembrança dos amigos sobre o Team Roping — não inventar.
      text: "Aguardando uma lembrança dos amigos sobre o Team Roping.",
    },
  ],
}
