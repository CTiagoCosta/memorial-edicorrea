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
}

export const edivaldoContent: PersonContent = {
  name: "Edivaldo Junior",
  nickname: "Edi",
  // TODO: aguardando data de nascimento e falecimento exatas da família —
  // não inventar datas: manter "???" até a família confirmar.
  years: "???",
  heroPhoto: "/assets/img/edi-hero.jpg",
  // TODO: aguardando uma frase ou lema marcante escolhido pela família —
  // não inventar um epitáfio.
  tagline: "Aguardando uma frase da família.",
  city: "Guararapes - SP",
  profession: "Engenheiro Eletricista — UNESP",
  // TODO: aguardando o nome oficial do clube/associação de laço da família.
  ropingClub: "Team Roping",
  // TODO: aguardando o texto de história definitivo da família.
  bio: "Edi era engenheiro eletricista formado pela UNESP e vivia em Guararapes-SP. Nas horas livres, sua paixão era cavalgar e competir no Team Roping, ao lado dos amigos do clube de laço.",
}
