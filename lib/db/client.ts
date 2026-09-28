import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

declare global {
  // eslint-disable-next-line no-var
  var prismaClient: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("Missing environment variable: DATABASE_URL")
  }

  // WebSocket adapter (Pool): the HTTP adapter rejects any $transaction call.
  const adapter = new PrismaNeon({ connectionString })
  return new PrismaClient({ adapter })
}

export const prisma = globalThis.prismaClient ?? createClient()

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaClient = prisma
}
