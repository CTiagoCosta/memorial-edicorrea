# Memorial Edivaldo Junior ("Edi Correa") — Design

## Contexto

Memorial digital em homenagem a Edivaldo Junior, 25 anos, de Guararapes-SP,
engenheiro eletricista (UNESP) e praticante de Team Roping (laço em dupla).
Faleceu jovem; o site é uma homenagem construída pela família, no mesmo
espírito do projeto irmão `memorial-familia-grotto`, mas para uma única
pessoa e com stack de dados diferente (Neon + Cloudinary em vez de Supabase).

Dados de conteúdo ainda pendentes com a família (data de nascimento e de
falecimento exatas, nome oficial de algum clube/associação de laço, frase ou
apelido marcante). O projeto é estruturado agora com esses campos como
placeholders editáveis em `content/edivaldo.ts`, sem bloquear o
desenvolvimento.

## Objetivo e critérios de sucesso

- Site público, responsivo, com visual rústico-moderno que remeta à vida no
  campo e ao Team Roping sem cair no clichê "cowboy".
- Qualquer visitante pode ler a história, ver fotos, ler depoimentos e curtir
  depoimentos.
- Só a família (senha única compartilhada) pode publicar novas fotos e novos
  depoimentos.
- Conteúdo textual (bio, frase, datas) fica centralizado em arquivos de
  conteúdo, fácil de atualizar quando a família enviar os dados finais.

## Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript, seguindo a
  mesma estrutura de pastas do `memorial-familia-grotto` (`app/`,
  `components/`, `components/ui/` via shadcn, `actions/`, `content/`, `lib/`).
- **Estilo**: Tailwind CSS + shadcn/ui + `tailwindcss-animate`, `next-themes`
  para dark mode.
- **Banco**: Neon (Postgres serverless) + Prisma ORM, seguindo o padrão do
  projeto `letra-livre` (`DATABASE_URL` com string de conexão direta,
  `sslmode=require`, sem "-pooler").
- **Armazenamento de fotos**: Cloudinary, seguindo o padrão do projeto
  `dpu-comunidades` (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
  `CLOUDINARY_API_SECRET`, SDK `cloudinary` v2, `upload_stream`).
- **Deploy**: Vercel.
- **Testes**: Vitest + Testing Library + jsdom, mesmo padrão do Grotto (um
  `.test.tsx`/`.test.ts` por componente principal e por action).

## Modelo de dados (Prisma / Neon)

```prisma
model Testimonial {
  id        String   @id @default(uuid())
  name      String
  message   String
  likes     Int      @default(0)
  likedBy   String[] @default([])
  createdAt DateTime @default(now())
}

enum GalleryCategory {
  GERAL
  ROPING
}

model GalleryImage {
  id                String          @id @default(uuid())
  title             String
  description       String?
  category          GalleryCategory @default(GERAL)
  cloudinaryPublicId String
  url               String
  createdAt         DateTime        @default(now())

  @@index([category, createdAt])
}
```

Sem tabela de sessão: a autenticação da família não persiste estado no
banco (ver seção Autenticação).

## Autenticação da família

Mesmo mecanismo do Grotto, adaptado para uma senha só (não há divisão por
pessoa):

- `FAMILY_PASSWORD_HASH` (bcrypt) nas variáveis de ambiente.
- Server Action `family-auth.ts` (cópia direta do padrão do Grotto): recebe
  a senha digitada, valida com `verifyPassword` (bcrypt) contra
  `FAMILY_PASSWORD_HASH`; se válida, seta um cookie httpOnly com
  `signSession()` (`lib/auth/session.ts`, HMAC com `SESSION_SECRET`, sem
  JWT).
- `getFamilySession()` (`lib/auth/get-family-session.ts`) lê e valida o
  cookie nas actions que exigem permissão.
- **Exige senha da família**: publicar foto, excluir foto, excluir
  depoimento.
- **Aberto a qualquer visitante, sem senha**: publicar um novo depoimento e
  curtir um depoimento — mesmo comportamento do Grotto, onde qualquer amigo
  pode deixar uma mensagem e só a família modera (exclui). Isso importa
  aqui porque os amigos do clube de laço não têm a senha da família e
  ainda assim devem poder escrever um depoimento.
- Curtidas usam um identificador anônimo por visitante (UUID gerado e
  guardado em `localStorage`, igual ao Grotto) para permitir curtir/descurtir
  sem exigir conta.

## Upload de fotos (Cloudinary)

Server Action `gallery.ts`:

1. Verifica sessão de família (`getFamilySession()`); sem sessão, retorna
   erro.
2. Valida o arquivo: `image/*`, até 5MB (mesmo limite do Grotto).
3. Faz upload via `cloudinary.uploader.upload_stream` para a pasta
   `memorial-edicorreia/gallery`, com `public_id` gerado (uuid).
4. Salva no Postgres: `title`, `description`, `category`,
   `cloudinaryPublicId`, `url` (o `secure_url` retornado pelo Cloudinary).
5. Exclusão: chama `cloudinary.uploader.destroy(publicId)` e depois remove a
   linha do banco.

Não é necessário bucket público separado — o Cloudinary já serve as URLs
publicamente por padrão.

## Estrutura de páginas e componentes

Uma única rota (`app/page.tsx`), rolagem vertical por seções, navegação por
âncoras (como no Grotto):

1. **`hero-section.tsx`** — foto de destaque em tela cheia, nome/apelido
   ("Edi Correa"), anos de vida (placeholder `"???"` até vir a data real),
   frase de efeito (placeholder até vir da família).
2. **`about-section.tsx`** — história dele: Guararapes-SP, Engenharia
   Elétrica na UNESP, texto livre editável em `content/edivaldo.ts`.
3. **`roping-section.tsx`** — seção dedicada à paixão pelo Team
   Roping/cavalgar: texto curto + mini-galeria (`GalleryImage` filtrada por
   `category: "ROPING"`), reaproveitando o componente de galeria com um
   prop de categoria.
4. **`family-gallery-section.tsx`** — grade de fotos gerais
   (`category: "GERAL"`), com botão "Adicionar Foto" que abre um dialog de
   upload (exige login da família inline, como o Grotto faz).
5. **`testimonials-section.tsx`** — mural de depoimentos: lista de cards
   (nome, mensagem, contador de curtidas com botão de curtir livre para
   qualquer visitante) + formulário de novo depoimento (exige senha da
   família).
6. **`footer.tsx`** — "Em memória de Edivaldo Junior", ano do site.
7. **`navigation.tsx`** — menu fixo com âncoras para as seções acima.
8. **`family-login-dialog.tsx`** — reaproveitado do padrão Grotto, sem a
   troca de "pessoa" (só uma senha).

Componentes `ui/*` (shadcn) copiados/gerados conforme necessidade: button,
card, dialog, input, label, textarea, avatar, badge, tabs (se necessário
para separar categorias de galeria), switch (dark mode).

## Visual (rústico-moderno)

- **Paleta clara**: fundo `#F5F1EA` (bege quebrado), texto `#2B2420`
  (marrom quase preto), destaque primário terracota `#C1552C`, destaque
  secundário verde-oliva `#5C6B4A`, acento couro `#8B5E3C`.
- **Paleta escura** (via `next-themes`): fundo `#1C1815` (couro escuro),
  texto `#F1EBE3`, mesmos destaques terracota/verde-oliva ajustados para
  contraste.
- **Tipografia**: serifada de impacto para títulos de seção (ex. Fraunces
  ou Playfair Display, via `next/font/google`), Inter para corpo de texto
  (mesma fonte do Grotto).
- **Textura**: grão sutil (CSS `background-image` com ruído leve ou SVG
  noise) aplicado só em faixas de destaque (hero, footer), nunca no corpo
  de texto, para não prejudicar legibilidade.
- **Imagens**: tratamento com cantos levemente arredondados, sem molduras
  pesadas; hero com overlay gradiente escuro para legibilidade do texto.

## Conteúdo (`content/edivaldo.ts`)

```ts
export const edivaldoContent = {
  name: "Edivaldo Junior",
  nickname: "Edi",
  years: "???", // TODO: aguardando datas exatas da família
  heroPhoto: "/assets/img/edi-hero.jpeg",
  tagline: "TODO: frase marcante (aguardando família)",
  city: "Guararapes - SP",
  profession: "Engenheiro Eletricista — UNESP",
  ropingClub: "TODO: nome do clube/associação (aguardando família)",
  bio: "TODO: texto de história (aguardando família)",
}
```

Todos os campos `TODO` ficam visíveis no código com comentário, para não
serem esquecidos, e podem ser preenchidos sem tocar em componentes.

## Testes

Mesma cobertura do Grotto: um teste por componente de seção (renderiza
conteúdo, estados de loading/erro básicos) e um teste por Server Action
(mockando Prisma Client e o SDK do Cloudinary).

## Fora de escopo (YAGNI)

- Seção de música/trilha sonora (decidido: não incluir).
- Curtidas em fotos da galeria (decidido: só em depoimentos).
- Divisão de conteúdo por múltiplas pessoas (é memorial de uma pessoa só).
- Tabela de sessão no banco (cookie assinado é suficiente, como no Grotto).
