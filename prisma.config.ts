import { config } from "dotenv"
import { defineConfig, env } from "prisma/config"

// Prisma's CLI does not read Next.js's .env.local convention on its own.
config({ path: ".env.local" })

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
})
