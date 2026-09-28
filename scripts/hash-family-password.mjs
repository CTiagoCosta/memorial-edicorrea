import bcrypt from "bcryptjs"

const password = process.argv[2]
if (!password) {
  console.error("Uso: node scripts/hash-family-password.mjs <senha>")
  process.exit(1)
}

const hash = await bcrypt.hash(password, 12)
const escapedHash = hash.replaceAll("$", "\\$")

console.log("\nPara o .env.local (o Next.js expande $ em arquivos .env, por isso os $ abaixo vêm escapados com \\$):")
console.log("FAMILY_PASSWORD_HASH=" + escapedHash)

console.log("\nPara as variáveis de ambiente da Vercel (cole o valor sem escape, direto no campo):")
console.log("FAMILY_PASSWORD_HASH=" + hash)
console.log()
