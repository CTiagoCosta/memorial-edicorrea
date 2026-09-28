# Memorial Edivaldo Junior

Memorial digital em homenagem a Edivaldo Junior ("Edi"), 25 anos, de
Guararapes-SP, engenheiro eletricista formado pela UNESP e apaixonado por
cavalgar e pelo Team Roping.

## Stack

Next.js 15 (App Router) + React 19 + Tailwind + shadcn/ui, Neon Postgres via
Prisma, fotos no Cloudinary, hospedado na Vercel.

## Configuração local

1. `npm install`
2. Crie um banco em https://neon.tech e copie a string de conexão **direta**
   (sem `-pooler`) com `sslmode=require`.
3. Crie uma conta em https://cloudinary.com e copie `Cloud name`, `API Key`
   e `API Secret` do dashboard.
4. Copie `.env.example` para `.env.local` e preencha:
   - `DATABASE_URL` — a string de conexão do Neon.
   - `FAMILY_PASSWORD_HASH` — gere com
     `node scripts/hash-family-password.mjs "sua-senha-de-familia"`.
     **Atenção:** cole a versão com `\$` (escapada) que o script imprime —
     o Next.js expande `$` em arquivos `.env`, e um hash bcrypt sem escape
     (`$2a$12$...`) seria truncado silenciosamente. Na Vercel, use a versão
     sem escape.
   - `SESSION_SECRET` — qualquer string longa e aleatória. A sessão da
     família expira sozinha depois de 30 dias; para derrubar todo mundo
     antes disso (por exemplo, se um dispositivo compartilhado foi
     comprometido), troque este valor — isso invalida todas as sessões
     ativas na hora.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
5. `npx prisma generate && npx prisma db push` (cria as tabelas no Neon a
   partir de `prisma/schema.prisma`). `db push` é suficiente para este
   projeto do zero; se o schema mudar depois de já haver dados reais no
   Neon, prefira `npx prisma migrate dev` a partir dali, para manter um
   histórico de migrações versionado em vez de sincronizar às cegas.
6. `npm run dev` e acesse http://localhost:3000

## Deploy

1. Suba o repositório para o GitHub.
2. Importe o projeto na Vercel.
3. Configure as mesmas 6 variáveis de ambiente acima nas configurações do
   projeto na Vercel (use a versão sem escape do `FAMILY_PASSWORD_HASH`).
4. Deploy.

## Conteúdo

- `content/edivaldo.ts` — nome, apelido, datas, cidade, profissão, clube de
  laço e texto de história. Os campos marcados com `TODO` ficam pendentes
  até a família enviar a informação definitiva; edite este arquivo quando
  chegarem.
- `public/assets/img/edi-hero.jpg` — foto de destaque usada no topo do
  site; adicione o arquivo real nesse caminho.
- Fotos da galeria (geral e Team Roping) e depoimentos são publicados pela
  própria família e pelos amigos direto pelo site: fotos exigem a senha da
  família (botão "Adicionar Foto"), depoimentos são abertos a qualquer
  visitante.
