import { config } from "dotenv"
import { defineConfig } from "prisma/config"

// Prisma's CLI does not read Next.js's .env.local convention on its own.
config({ path: ".env.local" })

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Deliberately not the `env()` helper: it throws immediately if the
    // variable is unset, which would break `npm install`'s `postinstall`
    // (plain `prisma generate` needs no live datasource) for anyone who
    // hasn't configured `.env.local` yet. `datasource.url` is optional and
    // only actually required by migration/introspection commands, which
    // give their own clear error if it's still missing when they run.
    url: process.env.DATABASE_URL,
  },
})
