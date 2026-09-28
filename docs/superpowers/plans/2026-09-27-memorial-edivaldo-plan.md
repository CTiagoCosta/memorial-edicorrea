# Memorial Edivaldo Junior Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the memorial site for Edivaldo Junior ("Edi Correa") — a public Next.js site with a rustic-modern visual identity, a family-gated photo gallery (general + Team Roping), and an open testimonial wall with anonymous likes.

**Architecture:** Next.js 15 App Router + React 19 + TypeScript, styled with Tailwind + shadcn/ui, following the file layout of the sibling project `memorial-familia-grotto` (`app/`, `components/`, `components/ui/`, `actions/`, `content/`, `lib/`). Data lives in Neon Postgres via Prisma (driver adapter, like `letra-livre`); photos live in Cloudinary (like `dpu-comunidades`). A single shared family password (bcrypt hash + HMAC-signed cookie) gates photo publishing/deletion and testimonial deletion; testimonials themselves and likes stay open to any visitor.

**Tech Stack:** Next.js 15.5, React 19, TypeScript 5, Tailwind CSS 3.4, shadcn/ui, next-themes, lucide-react, Prisma 7 + `@prisma/adapter-neon` + `@neondatabase/serverless`, `cloudinary` v2 SDK, `bcryptjs`, Vitest + Testing Library + jsdom.

**Spec:** `docs/superpowers/specs/2026-09-27-memorial-edivaldo-design.md`

## Global Constraints

- Next.js 15 (App Router) + React 19 + TypeScript, matching `memorial-familia-grotto`'s folder layout (`app/`, `components/`, `components/ui/`, `actions/`, `content/`, `lib/`).
- Tailwind CSS + shadcn/ui (`style: "default"`, `baseColor: "neutral"`, `cssVariables: true`) + `tailwindcss-animate`, `next-themes` for dark mode.
- Database: Neon Postgres via Prisma ORM using `@prisma/adapter-neon` (WebSocket adapter — required for `$transaction` support, unlike the HTTP adapter). `DATABASE_URL` is the **direct** connection string (no `-pooler`), with `sslmode=require`.
- Photo storage: Cloudinary SDK v2 (`cloudinary` npm package), configured from `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`.
- Auth: one shared family password. `FAMILY_PASSWORD_HASH` (bcrypt, 12 rounds) + `SESSION_SECRET` (HMAC-signed cookie, no JWT, no DB session table).
- Authorization split: **family password required** for photo upload, photo delete, testimonial delete. **Open to all visitors, no password**: adding a testimonial, liking a testimonial (anonymous id in `localStorage`).
- No music/soundtrack section. No likes on gallery photos. No multi-person split (single memorial).
- Vitest + `@testing-library/react` + jsdom for all tests, mirroring `memorial-familia-grotto`'s test style (`vi.mock` the data layer, assert on the mapped DTOs).
- Package manager: npm.
- Deploy target: Vercel (`images: { unoptimized: true }` in `next.config.mjs`, same as the reference project, since Cloudinary already serves optimized URLs).

## Review Focus

- A visitor submits a testimonial with an empty or whitespace-only name/message — `addTestimonial` must reject it with "Nome e mensagem são obrigatórios." without touching the database (Task 6).
- Two different anonymous visitors like the same testimonial concurrently — each call only ever adds/removes its own `sessionId` from `likedBy`, so `likeTestimonial` must be tested against an existing non-empty `likedBy` array, not just the empty-array case (Task 6).
- Someone tries to like or delete a testimonial id that does not exist — `likeTestimonial` and `deleteTestimonial` must return a clear error instead of throwing (Task 6).
- A file that is not an image, or an image over 5MB, is submitted to `uploadGalleryImage` even by an authorized family session — must be rejected before any Cloudinary call happens (Task 5).
- Someone without the family cookie calls `uploadGalleryImage`, `deleteGalleryImage`, or `deleteTestimonial` directly (not just through the UI) — every one of these three actions must independently check `getFamilySession()` and fail closed (Tasks 5 and 6).

---

## File Structure

```
memorial-edicorreia/
├── prisma/
│   └── schema.prisma
├── content/
│   └── edivaldo.ts
├── lib/
│   ├── db/
│   │   └── client.ts
│   ├── cloudinary/
│   │   └── server.ts
│   ├── auth/
│   │   ├── password.ts
│   │   ├── session.ts
│   │   └── get-family-session.ts
│   ├── format.ts
│   └── utils.ts
├── actions/
│   ├── family-auth.ts
│   ├── gallery.ts
│   └── testimonials.ts
├── components/
│   ├── ui/ (shadcn: button, card, dialog, input, label, textarea, alert, badge, switch)
│   ├── theme-provider.tsx
│   ├── navigation.tsx
│   ├── hero-section.tsx
│   ├── about-section.tsx
│   ├── roping-section.tsx
│   ├── gallery-section.tsx
│   ├── testimonials-section.tsx
│   ├── family-login-dialog.tsx
│   └── footer.tsx
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
└── scripts/
    └── hash-family-password.mjs
```

`gallery-section.tsx` is the one shared, parameterized gallery grid (title, category, upload dialog, lightbox) used both by the general family gallery and by the Team Roping mini-gallery — this avoids duplicating the whole grid/upload/lightbox implementation the way a two-file copy would.

---

### Task 1: Project scaffolding, Tailwind config, and design tokens

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `next-env.d.ts`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `components.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `.gitignore`
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `lib/utils.ts`
- Test: `lib/utils.test.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `lib/utils.ts`, used by every shadcn UI component in later tasks.
- Produces: Tailwind color tokens `clay-{50..950}` (primary/terracota) and `campo-{50..950}` (secondary/oliveira), plus CSS variables `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`, consumed by every component's className in later tasks.
- Produces: font CSS variables `--font-heading` (Fraunces) and `--font-body` (Inter), mapped to Tailwind's `font-serif` / `font-sans`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "memorial-edicorreia",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@neondatabase/serverless": "^1.1.0",
    "@prisma/adapter-neon": "^7.8.0",
    "@prisma/client": "^7.8.0",
    "@radix-ui/react-dialog": "1.1.4",
    "@radix-ui/react-label": "2.1.1",
    "@radix-ui/react-slot": "1.1.1",
    "@radix-ui/react-switch": "1.1.2",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cloudinary": "^2.5.0",
    "lucide-react": "^0.454.0",
    "next": "15.5.22",
    "next-themes": "^0.4.4",
    "react": "^19",
    "react-dom": "^19",
    "tailwind-merge": "^2.5.5",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "postcss": "^8.5",
    "prisma": "^7.8.0",
    "tailwindcss": "^3.4.17",
    "typescript": "^5",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "target": "ES6",
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 4: Create `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  images: { unoptimized: true },
}

export default nextConfig
```

- [ ] **Step 5: Create `postcss.config.mjs`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        clay: {
          50: "#fbf0ea",
          100: "#f6dccb",
          200: "#edbba0",
          300: "#e29a76",
          400: "#d57a52",
          500: "#c1552c",
          600: "#a34322",
          700: "#82361c",
          800: "#642917",
          900: "#481d10",
          950: "#2e120a",
        },
        campo: {
          50: "#f2f4ee",
          100: "#e1e7d6",
          200: "#c3d0af",
          300: "#a3b888",
          400: "#869e68",
          500: "#5c6b4a",
          600: "#4a5639",
          700: "#39422b",
          800: "#2a301f",
          900: "#1e2216",
          950: "#12140d",
        },
      },
      fontFamily: {
        serif: ["var(--font-heading)"],
        sans: ["var(--font-body)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
```

- [ ] **Step 7: Create `components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 8: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
})
```

- [ ] **Step 9: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest"
```

- [ ] **Step 10: Create `.gitignore`**

```
node_modules
.next
.env.local
.env
```

- [ ] **Step 11: Create `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 38 36% 94%;
    --foreground: 22 15% 15%;
    --card: 0 0% 100%;
    --card-foreground: 22 15% 15%;
    --popover: 0 0% 100%;
    --popover-foreground: 22 15% 15%;
    --primary: 17 63% 46%;
    --primary-foreground: 38 30% 98%;
    --secondary: 87 20% 90%;
    --secondary-foreground: 22 15% 15%;
    --muted: 87 20% 90%;
    --muted-foreground: 22 10% 40%;
    --accent: 26 35% 88%;
    --accent-foreground: 22 15% 15%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 38 30% 98%;
    --border: 38 15% 85%;
    --input: 38 15% 85%;
    --ring: 17 63% 46%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 26 14% 10%;
    --foreground: 34 33% 92%;
    --card: 26 12% 13%;
    --card-foreground: 34 33% 92%;
    --popover: 26 12% 13%;
    --popover-foreground: 34 33% 92%;
    --primary: 17 60% 60%;
    --primary-foreground: 26 20% 12%;
    --secondary: 26 10% 18%;
    --secondary-foreground: 34 33% 92%;
    --muted: 26 10% 18%;
    --muted-foreground: 34 10% 65%;
    --accent: 26 15% 20%;
    --accent-foreground: 34 33% 92%;
    --destructive: 0 62% 45%;
    --destructive-foreground: 34 33% 92%;
    --border: 26 12% 22%;
    --input: 26 12% 22%;
    --ring: 17 60% 60%;
  }

  * { @apply border-border; }
  body { @apply bg-background text-foreground font-sans; }
  h1, h2, h3, h4 { @apply font-serif; }
}

html { scroll-behavior: smooth; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
```

- [ ] **Step 12: Create `lib/utils.ts`**

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 13: Write `lib/utils.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
  it("merges class names and resolves Tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("drops falsy values", () => {
    expect(cn("block", false && "hidden", undefined, "text-sm")).toBe("block text-sm")
  })
})
```

- [ ] **Step 14: Create `components/theme-provider.tsx`**

```tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

- [ ] **Step 15: Create `app/layout.tsx`**

```tsx
import type { Metadata } from "next"
import { Fraunces, Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const heading = Fraunces({ subsets: ["latin"], variable: "--font-heading" })
const body = Inter({ subsets: ["latin"], variable: "--font-body" })

export const metadata: Metadata = {
  title: "Memorial Edivaldo Junior",
  description: "Em memória de Edivaldo Junior — Edi",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${heading.variable} ${body.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 16: Install dependencies and run the test suite**

Run: `npm install && npm test`
Expected: `lib/utils.test.ts` passes (2 tests). `npm run dev` starts and serves a blank-but-styled page with no console errors (there is no content in `app/page.tsx` yet — that's fine, it is created in Task 12).

- [ ] **Step 17: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs next-env.d.ts postcss.config.mjs tailwind.config.ts components.json vitest.config.ts vitest.setup.ts .gitignore app/globals.css app/layout.tsx lib/utils.ts lib/utils.test.ts components/theme-provider.tsx
git commit -m "Scaffold Next.js project with rustic-modern design tokens"
```

---

### Task 2: shadcn/ui primitives

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/dialog.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/label.tsx`
- Create: `components/ui/textarea.tsx`
- Create: `components/ui/alert.tsx`
- Create: `components/ui/badge.tsx`
- Create: `components/ui/switch.tsx`
- Test: `components/ui/button.test.tsx`

**Interfaces:**
- Consumes: `cn` from `lib/utils.ts` (Task 1).
- Produces: `Button`/`buttonVariants`, `Card`/`CardContent`/`CardHeader`, `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`, `Input`, `Label`, `Textarea`, `Alert`/`AlertDescription`, `Badge`, `Switch` — all consumed by every component from Task 8 onward.

- [ ] **Step 1: Create `components/ui/button.tsx`**

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

- [ ] **Step 2: Create `components/ui/card.tsx`**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground", className)} {...props} />
  ),
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
)
CardHeader.displayName = "CardHeader"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
)
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardContent }
```

- [ ] **Step 3: Create `components/ui/dialog.tsx`**

```tsx
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogPortal = DialogPrimitive.Portal

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/60 backdrop-blur-sm", className)}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
        <X className="h-4 w-4" />
        <span className="sr-only">Fechar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

export { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogTitle }
```

- [ ] **Step 4: Create `components/ui/input.tsx`**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Input.displayName = "Input"

export { Input }
```

- [ ] **Step 5: Create `components/ui/label.tsx`**

```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

- [ ] **Step 6: Create `components/ui/textarea.tsx`**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Textarea.displayName = "Textarea"

export { Textarea }
```

- [ ] **Step 7: Create `components/ui/alert.tsx`**

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva("relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4", {
  variants: {
    variant: {
      default: "bg-background text-foreground",
      destructive: "border-destructive/50 text-destructive [&>svg]:text-destructive",
    },
  },
  defaultVariants: { variant: "default" },
})

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  ),
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }
```

- [ ] **Step 8: Create `components/ui/badge.tsx`**

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
```

- [ ] **Step 9: Create `components/ui/switch.tsx`**

```tsx
"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
```

- [ ] **Step 10: Write `components/ui/button.test.tsx`**

```tsx
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Button } from "./button"

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Publicar</Button>)
    expect(screen.getByRole("button", { name: "Publicar" })).toBeInTheDocument()
  })

  it("applies the destructive variant classes", () => {
    render(<Button variant="destructive">Excluir</Button>)
    expect(screen.getByRole("button", { name: "Excluir" })).toHaveClass("bg-destructive")
  })
})
```

- [ ] **Step 11: Run the tests**

Run: `npm test`
Expected: All tests pass, including the 2 new `Button` tests.

- [ ] **Step 12: Commit**

```bash
git add components/ui
git commit -m "Add shadcn/ui primitives"
```

---

### Task 3: Prisma schema and Neon client

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `package.json` (add the `postinstall` script now that a schema exists to generate from)
- Create: `lib/db/client.ts`
- Create: `.env.example`
- Test: `lib/db/client.test.ts`

**Interfaces:**
- Produces: `prisma` (a `PrismaClient` instance) from `lib/db/client.ts`, and the Prisma-generated types `Testimonial`, `GalleryImage`, `GalleryCategory` (`"GERAL" | "ROPING"`) from `@prisma/client`, both consumed by `actions/gallery.ts` and `actions/testimonials.ts` (Tasks 5 and 6).

- [ ] **Step 1: Create `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

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
  id                 String          @id @default(uuid())
  title              String
  description        String?
  category           GalleryCategory @default(GERAL)
  cloudinaryPublicId String
  url                String
  createdAt          DateTime        @default(now())

  @@index([category, createdAt])
}
```

- [ ] **Step 2: Add the `postinstall` script to `package.json`**

Now that `prisma/schema.prisma` exists, wire `prisma generate` to run automatically after every `npm install` (this could not be added in Task 1, since `prisma generate` fails without a schema file). Edit the `"scripts"` block in `package.json` to:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "postinstall": "prisma generate"
  },
```

- [ ] **Step 3: Create `lib/db/client.ts`**

```ts
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
```

- [ ] **Step 4: Create `.env.example`**

```
# Banco Postgres (Neon). Use a string de conexao DIRETA (sem "-pooler") com sslmode=require.
DATABASE_URL=postgresql://usuario:senha@host.neon.tech/nome_do_banco?sslmode=require

# Senha da familia (bcrypt hash). Gere com:
#   node scripts/hash-family-password.mjs "sua-senha-de-familia"
FAMILY_PASSWORD_HASH=

# Segredo do cookie de sessao. Gere um novo e forte para cada ambiente:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
SESSION_SECRET=

# Fotos (Cloudinary)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

- [ ] **Step 5: Write `lib/db/client.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation((options) => ({ __options: options })),
}))
vi.mock("@prisma/adapter-neon", () => ({
  PrismaNeon: vi.fn().mockImplementation((options) => ({ __adapterOptions: options })),
}))

describe("prisma client", () => {
  beforeEach(() => {
    vi.resetModules()
    delete globalThis.prismaClient
    process.env.DATABASE_URL = "postgresql://test/test?sslmode=require"
  })

  it("throws a clear error when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL
    await expect(import("./client")).rejects.toThrow("Missing environment variable: DATABASE_URL")
  })

  it("builds a client backed by the Neon adapter when DATABASE_URL is set", async () => {
    const { prisma } = await import("./client")
    expect(prisma).toBeDefined()
  })
})
```

- [ ] **Step 6: Validate the schema and run the tests**

Run: `npx prisma validate && npx prisma generate && npm test`
Expected: `prisma validate` reports the schema is valid, `prisma generate` produces the client, and `lib/db/client.test.ts` passes.

- [ ] **Step 7: Commit**

```bash
git add package.json prisma lib/db .env.example
git commit -m "Add Prisma schema and Neon client for gallery/testimonial data"
```

---

### Task 4: Family authentication (password, session, login/logout action, login dialog)

**Files:**
- Create: `lib/auth/password.ts`
- Create: `lib/auth/session.ts`
- Create: `lib/auth/get-family-session.ts`
- Create: `actions/family-auth.ts`
- Create: `components/family-login-dialog.tsx`
- Create: `scripts/hash-family-password.mjs`
- Test: `lib/auth/password.test.ts`
- Test: `lib/auth/session.test.ts`
- Test: `actions/family-auth.test.ts`

**Interfaces:**
- Produces: `hashPassword`, `verifyPassword` (`lib/auth/password.ts`); `SESSION_COOKIE_NAME`, `signSession()`, `verifySession(token?: string): boolean` (`lib/auth/session.ts`); `getFamilySession(): Promise<boolean>` (`lib/auth/get-family-session.ts`) — consumed by `actions/gallery.ts` and `actions/testimonials.ts` (Tasks 5, 6) to gate photo/testimonial deletion and photo upload.
- Produces: `loginFamily(prevState: LoginState, formData: FormData): Promise<LoginState>`, `logoutFamily(): Promise<void>`, `LoginState` (`actions/family-auth.ts`) and `FamilyLoginDialog` (`components/family-login-dialog.tsx`) — consumed by `gallery-section.tsx` and `navigation.tsx` (Tasks 8, 10).

- [ ] **Step 1: Write `lib/auth/password.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { hashPassword, verifyPassword } from "./password"

describe("password hashing", () => {
  it("verifies a password against its own hash", async () => {
    const hash = await hashPassword("senha-da-familia")
    expect(await verifyPassword("senha-da-familia", hash)).toBe(true)
  })

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("senha-da-familia")
    expect(await verifyPassword("senha-errada", hash)).toBe(false)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/auth/password.test.ts`
Expected: FAIL — `Cannot find module './password'`.

- [ ] **Step 3: Create `lib/auth/password.ts`**

```ts
import bcrypt from "bcryptjs"

const SALT_ROUNDS = 12

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run lib/auth/password.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Write `lib/auth/session.test.ts`**

```ts
import { beforeEach, describe, expect, it } from "vitest"
import { SESSION_COOKIE_NAME, signSession, verifySession } from "./session"

describe("session signing", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret"
  })

  it("exposes a stable cookie name", () => {
    expect(SESSION_COOKIE_NAME).toBe("edi_family_session")
  })

  it("verifies a token produced by signSession", () => {
    const token = signSession()
    expect(verifySession(token)).toBe(true)
  })

  it("rejects an undefined token", () => {
    expect(verifySession(undefined)).toBe(false)
  })

  it("rejects a tampered token", () => {
    const token = signSession()
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a")
    expect(verifySession(tampered)).toBe(false)
  })

  it("rejects a token signed with a different secret", () => {
    const token = signSession()
    process.env.SESSION_SECRET = "different-secret"
    expect(verifySession(token)).toBe(false)
  })
})
```

- [ ] **Step 6: Create `lib/auth/session.ts`**

```ts
import { createHmac, timingSafeEqual } from "node:crypto"

export const SESSION_COOKIE_NAME = "edi_family_session"

const PAYLOAD = "family-authorized"

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error("Missing environment variable: SESSION_SECRET")
  }
  return secret
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex")
}

export function signSession(): string {
  const signature = sign(PAYLOAD, getSecret())
  return `${PAYLOAD}.${signature}`
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false

  const separatorIndex = token.lastIndexOf(".")
  if (separatorIndex === -1) return false

  const payload = token.slice(0, separatorIndex)
  const signature = token.slice(separatorIndex + 1)
  if (payload !== PAYLOAD) return false

  let expectedSignature: string
  try {
    expectedSignature = sign(payload, getSecret())
  } catch {
    return false
  }

  const expected = Buffer.from(expectedSignature)
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length) return false

  return timingSafeEqual(expected, actual)
}
```

- [ ] **Step 7: Run it to verify it passes**

Run: `npx vitest run lib/auth/session.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 8: Create `lib/auth/get-family-session.ts`**

```ts
import { cookies } from "next/headers"
import { SESSION_COOKIE_NAME, verifySession } from "./session"

export async function getFamilySession(): Promise<boolean> {
  const cookieStore = await cookies()
  return verifySession(cookieStore.get(SESSION_COOKIE_NAME)?.value)
}
```

- [ ] **Step 9: Write `actions/family-auth.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock("next/headers", () => ({
  cookies: () => cookieStore,
}))

vi.mock("../lib/auth/password", () => ({
  verifyPassword: vi.fn(),
}))

import { verifyPassword } from "../lib/auth/password"
import { loginFamily, logoutFamily } from "./family-auth"
import { SESSION_COOKIE_NAME } from "../lib/auth/session"

describe("loginFamily", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SESSION_SECRET = "test-secret"
    process.env.FAMILY_PASSWORD_HASH = "stored-hash"
  })

  it("sets the session cookie when the password matches the stored hash", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(true)
    const formData = new FormData()
    formData.set("password", "correct-password")

    const result = await loginFamily({ error: null }, formData)

    expect(verifyPassword).toHaveBeenCalledWith("correct-password", "stored-hash")
    expect(cookieStore.set).toHaveBeenCalledWith(expect.objectContaining({ name: SESSION_COOKIE_NAME, httpOnly: true }))
    expect(result.error).toBeNull()
  })

  it("returns an error and does not set a cookie when the password is wrong", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(false)
    const formData = new FormData()
    formData.set("password", "wrong-password")

    const result = await loginFamily({ error: null }, formData)

    expect(cookieStore.set).not.toHaveBeenCalled()
    expect(result.error).toBe("Senha incorreta.")
  })
})

describe("logoutFamily", () => {
  it("deletes the session cookie", async () => {
    await logoutFamily()
    expect(cookieStore.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME)
  })
})
```

- [ ] **Step 10: Create `actions/family-auth.ts`**

```ts
"use server"

import { cookies } from "next/headers"
import { verifyPassword } from "@/lib/auth/password"
import { SESSION_COOKIE_NAME, signSession } from "@/lib/auth/session"

export interface LoginState {
  error: string | null
}

export async function loginFamily(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "")
  const storedHash = process.env.FAMILY_PASSWORD_HASH ?? ""

  const isValid = storedHash.length > 0 && (await verifyPassword(password, storedHash))
  if (!isValid) {
    return { error: "Senha incorreta." }
  }

  const cookieStore = await cookies()
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: signSession(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })

  return { error: null }
}

export async function logoutFamily(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
```

- [ ] **Step 11: Run the auth tests**

Run: `npx vitest run actions/family-auth.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 12: Create `components/family-login-dialog.tsx`**

```tsx
"use client"

import { useActionState, useState } from "react"
import { Lock, Shield, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { loginFamily, type LoginState } from "@/actions/family-auth"

interface FamilyLoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const initialState: LoginState = { error: null }

export function FamilyLoginDialog({ open, onOpenChange, onSuccess }: FamilyLoginDialogProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, pending] = useActionState(async (prev: LoginState, formData: FormData) => {
    const result = await loginFamily(prev, formData)
    if (!result.error) {
      onSuccess()
      onOpenChange(false)
    }
    return result
  }, initialState)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <span>Acesso da Família</span>
          </DialogTitle>
        </DialogHeader>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>Digite a senha combinada em família para publicar ou remover fotos.</AlertDescription>
        </Alert>
        <form action={formAction} className="space-y-3">
          {state.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Senha da família"
              autoFocus
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 13: Create `scripts/hash-family-password.mjs`**

```js
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
```

- [ ] **Step 14: Run the full test suite**

Run: `npm test`
Expected: All tests pass, including the new password/session/family-auth tests.

- [ ] **Step 15: Commit**

```bash
git add lib/auth actions/family-auth.ts actions/family-auth.test.ts components/family-login-dialog.tsx scripts
git commit -m "Add family password auth: hashing, signed session cookie, login dialog"
```

---

### Task 5: Cloudinary client and gallery Server Action

**Files:**
- Create: `lib/cloudinary/server.ts`
- Create: `actions/gallery.ts`
- Test: `actions/gallery.test.ts`

**Interfaces:**
- Consumes: `getFamilySession` (`lib/auth/get-family-session.ts`, Task 4), `prisma` (`lib/db/client.ts`, Task 3), `GalleryCategory` (`@prisma/client`, Task 3).
- Produces: `getCloudinaryClient()`, `GALLERY_FOLDER` (`lib/cloudinary/server.ts`); `GalleryImageDTO`, `listGalleryImages(category: GalleryCategory): Promise<GalleryImageDTO[]>`, `uploadGalleryImage(category: GalleryCategory, formData: FormData): Promise<{ error: string | null }>`, `deleteGalleryImage(imageId: string): Promise<{ error: string | null }>` (`actions/gallery.ts`) — consumed by `gallery-section.tsx` (Task 8).

- [ ] **Step 1: Create `lib/cloudinary/server.ts`**

```ts
import { v2 as cloudinary } from "cloudinary"

export const GALLERY_FOLDER = "memorial-edicorreia/gallery"

let configured = false

export function getCloudinaryClient(): typeof cloudinary {
  if (!configured) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Missing Cloudinary environment variables")
    }
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret })
    configured = true
  }
  return cloudinary
}
```

- [ ] **Step 2: Write `actions/gallery.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = {
  galleryImage: {
    findMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
}

const cloudinaryMock = {
  uploader: {
    upload_stream: vi.fn(),
    destroy: vi.fn(),
  },
}

vi.mock("../lib/db/client", () => ({ prisma: prismaMock }))
vi.mock("../lib/cloudinary/server", () => ({
  getCloudinaryClient: () => cloudinaryMock,
  GALLERY_FOLDER: "memorial-edicorreia/gallery",
}))
vi.mock("../lib/auth/get-family-session", () => ({ getFamilySession: vi.fn() }))

import { getFamilySession } from "../lib/auth/get-family-session"
import { deleteGalleryImage, listGalleryImages, uploadGalleryImage } from "./gallery"

describe("listGalleryImages", () => {
  beforeEach(() => vi.clearAllMocks())

  it("maps rows for the given category", async () => {
    prismaMock.galleryImage.findMany.mockResolvedValue([
      {
        id: "1",
        title: "Laço em dupla",
        description: null,
        category: "ROPING",
        cloudinaryPublicId: "memorial-edicorreia/gallery/1",
        url: "https://res.cloudinary.com/demo/image/upload/1.jpg",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
    ])

    const result = await listGalleryImages("ROPING")

    expect(prismaMock.galleryImage.findMany).toHaveBeenCalledWith({
      where: { category: "ROPING" },
      orderBy: { createdAt: "desc" },
    })
    expect(result[0].url).toBe("https://res.cloudinary.com/demo/image/upload/1.jpg")
    expect(result[0].createdAt).toBe("2026-01-01T00:00:00.000Z")
  })
})

describe("uploadGalleryImage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)
    const formData = new FormData()
    formData.set("title", "Foto")
    formData.set("file", new File(["a"], "a.jpg", { type: "image/jpeg" }))

    const result = await uploadGalleryImage("GERAL", formData)

    expect(result.error).toBe("Não autorizado.")
    expect(cloudinaryMock.uploader.upload_stream).not.toHaveBeenCalled()
  })

  it("rejects a non-image file even when authorized", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    const formData = new FormData()
    formData.set("title", "Foto")
    formData.set("file", new File(["a"], "a.txt", { type: "text/plain" }))

    const result = await uploadGalleryImage("GERAL", formData)

    expect(result.error).toBe("Apenas arquivos de imagem são permitidos.")
    expect(cloudinaryMock.uploader.upload_stream).not.toHaveBeenCalled()
  })

  it("rejects a file over 5MB", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" })
    const formData = new FormData()
    formData.set("title", "Foto")
    formData.set("file", bigFile)

    const result = await uploadGalleryImage("GERAL", formData)

    expect(result.error).toBe("Arquivo muito grande. Máximo 5MB.")
    expect(cloudinaryMock.uploader.upload_stream).not.toHaveBeenCalled()
  })

  it("uploads and creates the record when valid and authorized", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    cloudinaryMock.uploader.upload_stream.mockImplementation((_options, callback) => {
      callback(null, { secure_url: "https://res.cloudinary.com/demo/image/upload/new.jpg" })
      return { end: vi.fn() }
    })
    prismaMock.galleryImage.create.mockResolvedValue({})

    const formData = new FormData()
    formData.set("title", "Treino de laço")
    formData.set("description", "")
    formData.set("file", new File(["a"], "foto.jpg", { type: "image/jpeg" }))

    const result = await uploadGalleryImage("ROPING", formData)

    expect(prismaMock.galleryImage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ category: "ROPING", title: "Treino de laço" }),
      }),
    )
    expect(result.error).toBeNull()
  })
})

describe("deleteGalleryImage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)

    const result = await deleteGalleryImage("1")

    expect(result.error).toBe("Não autorizado.")
    expect(prismaMock.galleryImage.delete).not.toHaveBeenCalled()
  })

  it("returns an error when the image does not exist", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    prismaMock.galleryImage.findUnique.mockResolvedValue(null)

    const result = await deleteGalleryImage("missing")

    expect(result.error).toBe("Foto não encontrada.")
    expect(cloudinaryMock.uploader.destroy).not.toHaveBeenCalled()
  })

  it("removes from Cloudinary and the database when authorized", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    prismaMock.galleryImage.findUnique.mockResolvedValue({
      id: "1",
      cloudinaryPublicId: "memorial-edicorreia/gallery/1",
    })
    cloudinaryMock.uploader.destroy.mockResolvedValue({})
    prismaMock.galleryImage.delete.mockResolvedValue({})

    const result = await deleteGalleryImage("1")

    expect(cloudinaryMock.uploader.destroy).toHaveBeenCalledWith("memorial-edicorreia/gallery/1")
    expect(prismaMock.galleryImage.delete).toHaveBeenCalledWith({ where: { id: "1" } })
    expect(result.error).toBeNull()
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run actions/gallery.test.ts`
Expected: FAIL — `Cannot find module './gallery'`.

- [ ] **Step 4: Create `actions/gallery.ts`**

```ts
"use server"

import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/db/client"
import { getCloudinaryClient, GALLERY_FOLDER } from "@/lib/cloudinary/server"
import { getFamilySession } from "@/lib/auth/get-family-session"
import type { GalleryCategory } from "@prisma/client"

interface ActionResult {
  error: string | null
}

export interface GalleryImageDTO {
  id: string
  title: string
  description: string | null
  category: GalleryCategory
  url: string
  createdAt: string
}

interface GalleryImageRow {
  id: string
  title: string
  description: string | null
  category: GalleryCategory
  url: string
  createdAt: Date
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

function mapImage(row: GalleryImageRow): GalleryImageDTO {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    url: row.url,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listGalleryImages(category: GalleryCategory): Promise<GalleryImageDTO[]> {
  const rows = await prisma.galleryImage.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(mapImage)
}

export async function uploadGalleryImage(category: GalleryCategory, formData: FormData): Promise<ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }

  const file = formData.get("file")
  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()

  if (!(file instanceof File) || !title) {
    return { error: "Título e arquivo são obrigatórios." }
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Apenas arquivos de imagem são permitidos." }
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "Arquivo muito grande. Máximo 5MB." }
  }

  const cloudinary = getCloudinaryClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const publicId = `${GALLERY_FOLDER}/${randomUUID()}`

  const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ public_id: publicId }, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error("Falha no upload para o Cloudinary"))
        return
      }
      resolve(result)
    })
    stream.end(buffer)
  })

  await prisma.galleryImage.create({
    data: {
      title,
      description: description || null,
      category,
      cloudinaryPublicId: publicId,
      url: uploadResult.secure_url,
    },
  })

  return { error: null }
}

export async function deleteGalleryImage(imageId: string): Promise<ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }

  const image = await prisma.galleryImage.findUnique({ where: { id: imageId } })
  if (!image) {
    return { error: "Foto não encontrada." }
  }

  const cloudinary = getCloudinaryClient()
  await cloudinary.uploader.destroy(image.cloudinaryPublicId)
  await prisma.galleryImage.delete({ where: { id: imageId } })

  return { error: null }
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run actions/gallery.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/cloudinary actions/gallery.ts actions/gallery.test.ts
git commit -m "Add Cloudinary-backed gallery Server Action"
```

---

### Task 6: Testimonials Server Action

**Files:**
- Create: `actions/testimonials.ts`
- Test: `actions/testimonials.test.ts`

**Interfaces:**
- Consumes: `getFamilySession` (Task 4), `prisma` (Task 3).
- Produces: `TestimonialDTO`, `listTestimonials(): Promise<TestimonialDTO[]>`, `addTestimonial(name: string, message: string): Promise<{ error: string | null }>`, `likeTestimonial(testimonialId: string, sessionId: string): Promise<{ error: string | null }>`, `deleteTestimonial(testimonialId: string): Promise<{ error: string | null }>` — consumed by `testimonials-section.tsx` (Task 9).

- [ ] **Step 1: Write `actions/testimonials.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

const prismaMock = {
  testimonial: {
    findMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}

vi.mock("../lib/db/client", () => ({ prisma: prismaMock }))
vi.mock("../lib/auth/get-family-session", () => ({ getFamilySession: vi.fn() }))

import { getFamilySession } from "../lib/auth/get-family-session"
import { addTestimonial, deleteTestimonial, likeTestimonial, listTestimonials } from "./testimonials"

describe("listTestimonials", () => {
  beforeEach(() => vi.clearAllMocks())

  it("maps rows to the DTO shape", async () => {
    prismaMock.testimonial.findMany.mockResolvedValue([
      {
        id: "1",
        name: "Alguém do clube",
        message: "Saudade dos treinos juntos",
        likes: 2,
        likedBy: ["session-a"],
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
    ])

    const result = await listTestimonials()

    expect(prismaMock.testimonial.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } })
    expect(result).toEqual([
      {
        id: "1",
        name: "Alguém do clube",
        message: "Saudade dos treinos juntos",
        likes: 2,
        likedBy: ["session-a"],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ])
  })
})

describe("addTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects an empty name or message without touching the database", async () => {
    const result = await addTestimonial("  ", "mensagem")
    expect(result.error).toBe("Nome e mensagem são obrigatórios.")
    expect(prismaMock.testimonial.create).not.toHaveBeenCalled()
  })

  it("creates a trimmed testimonial when valid, without requiring a family session", async () => {
    prismaMock.testimonial.create.mockResolvedValue({})

    const result = await addTestimonial("  Maria  ", "  Com carinho  ")

    expect(prismaMock.testimonial.create).toHaveBeenCalledWith({
      data: { name: "Maria", message: "Com carinho" },
    })
    expect(result.error).toBeNull()
  })
})

describe("likeTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("adds the session and increments likes when not already liked", async () => {
    prismaMock.testimonial.findUnique.mockResolvedValue({ id: "1", likes: 1, likedBy: [] })
    prismaMock.testimonial.update.mockResolvedValue({})

    const result = await likeTestimonial("1", "session-a")

    expect(prismaMock.testimonial.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { likes: 2, likedBy: ["session-a"] },
    })
    expect(result.error).toBeNull()
  })

  it("removes the session and decrements likes when already liked among others", async () => {
    prismaMock.testimonial.findUnique.mockResolvedValue({
      id: "1",
      likes: 3,
      likedBy: ["session-a", "session-b", "session-c"],
    })
    prismaMock.testimonial.update.mockResolvedValue({})

    const result = await likeTestimonial("1", "session-b")

    expect(prismaMock.testimonial.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { likes: 2, likedBy: ["session-a", "session-c"] },
    })
    expect(result.error).toBeNull()
  })

  it("returns an error when the testimonial does not exist", async () => {
    prismaMock.testimonial.findUnique.mockResolvedValue(null)

    const result = await likeTestimonial("missing", "session-a")

    expect(result.error).toBe("Depoimento não encontrado.")
    expect(prismaMock.testimonial.update).not.toHaveBeenCalled()
  })
})

describe("deleteTestimonial", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when there is no valid family session", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(false)

    const result = await deleteTestimonial("1")

    expect(result.error).toBe("Não autorizado.")
    expect(prismaMock.testimonial.delete).not.toHaveBeenCalled()
  })

  it("deletes when the family session is valid", async () => {
    vi.mocked(getFamilySession).mockResolvedValue(true)
    prismaMock.testimonial.delete.mockResolvedValue({})

    const result = await deleteTestimonial("1")

    expect(prismaMock.testimonial.delete).toHaveBeenCalledWith({ where: { id: "1" } })
    expect(result.error).toBeNull()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run actions/testimonials.test.ts`
Expected: FAIL — `Cannot find module './testimonials'`.

- [ ] **Step 3: Create `actions/testimonials.ts`**

```ts
"use server"

import { prisma } from "@/lib/db/client"
import { getFamilySession } from "@/lib/auth/get-family-session"

interface ActionResult {
  error: string | null
}

export interface TestimonialDTO {
  id: string
  name: string
  message: string
  likes: number
  likedBy: string[]
  createdAt: string
}

interface TestimonialRow {
  id: string
  name: string
  message: string
  likes: number
  likedBy: string[]
  createdAt: Date
}

function mapTestimonial(row: TestimonialRow): TestimonialDTO {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    likes: row.likes,
    likedBy: row.likedBy,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listTestimonials(): Promise<TestimonialDTO[]> {
  const rows = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } })
  return rows.map(mapTestimonial)
}

export async function addTestimonial(name: string, message: string): Promise<ActionResult> {
  const trimmedName = name.trim()
  const trimmedMessage = message.trim()

  if (!trimmedName || !trimmedMessage) {
    return { error: "Nome e mensagem são obrigatórios." }
  }

  await prisma.testimonial.create({ data: { name: trimmedName, message: trimmedMessage } })
  return { error: null }
}

export async function likeTestimonial(testimonialId: string, sessionId: string): Promise<ActionResult> {
  const testimonial = await prisma.testimonial.findUnique({ where: { id: testimonialId } })
  if (!testimonial) {
    return { error: "Depoimento não encontrado." }
  }

  const alreadyLiked = testimonial.likedBy.includes(sessionId)
  const likedBy = alreadyLiked
    ? testimonial.likedBy.filter((id: string) => id !== sessionId)
    : [...testimonial.likedBy, sessionId]
  const likes = alreadyLiked ? testimonial.likes - 1 : testimonial.likes + 1

  await prisma.testimonial.update({ where: { id: testimonialId }, data: { likes, likedBy } })
  return { error: null }
}

export async function deleteTestimonial(testimonialId: string): Promise<ActionResult> {
  const authorized = await getFamilySession()
  if (!authorized) {
    return { error: "Não autorizado." }
  }

  await prisma.testimonial.delete({ where: { id: testimonialId } })
  return { error: null }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run actions/testimonials.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add actions/testimonials.ts actions/testimonials.test.ts
git commit -m "Add testimonials Server Action, open to all visitors"
```

---

### Task 7: Content file and Hero section

**Files:**
- Create: `content/edivaldo.ts`
- Create: `components/hero-section.tsx`
- Create: `public/assets/img/.gitkeep`
- Test: `components/hero-section.test.tsx`

**Interfaces:**
- Produces: `edivaldoContent` (`content/edivaldo.ts`) — consumed by `hero-section.tsx` (this task), `about-section.tsx` and `roping-section.tsx` (Task 8), `footer.tsx` (Task 10).
- Produces: `HeroSection` — consumed by `app/page.tsx` (Task 11).

- [ ] **Step 1: Create `content/edivaldo.ts`**

```ts
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
  // TODO: aguardando data de nascimento e falecimento exatas da família.
  years: "1999 – 2026",
  heroPhoto: "/assets/img/edi-hero.jpg",
  // TODO: aguardando uma frase ou lema marcante escolhido pela família.
  tagline: "Uma vida vivida com leveza, amizade e paixão pelo campo.",
  city: "Guararapes - SP",
  profession: "Engenheiro Eletricista — UNESP",
  // TODO: aguardando o nome oficial do clube/associação de laço da família.
  ropingClub: "Team Roping",
  // TODO: aguardando o texto de história definitivo da família.
  bio: "Edi era engenheiro eletricista formado pela UNESP e vivia em Guararapes-SP. Nas horas livres, sua paixão era cavalgar e competir no Team Roping, ao lado dos amigos do clube de laço.",
}
```

- [ ] **Step 2: Write `components/hero-section.test.tsx`**

```tsx
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { HeroSection } from "./hero-section"

describe("HeroSection", () => {
  it("shows the name, nickname, years and tagline", () => {
    render(<HeroSection />)
    expect(screen.getByRole("heading", { name: /edivaldo junior/i })).toBeInTheDocument()
    expect(screen.getByText(/"edi"/i)).toBeInTheDocument()
    expect(screen.getByText("1999 – 2026")).toBeInTheDocument()
  })

  it("links to the family gallery section", () => {
    render(<HeroSection />)
    expect(screen.getByRole("link", { name: /ver galeria da família/i })).toHaveAttribute("href", "#galeria-familia")
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run components/hero-section.test.tsx`
Expected: FAIL — `Cannot find module './hero-section'`.

- [ ] **Step 4: Create `components/hero-section.tsx`**

```tsx
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { edivaldoContent } from "@/content/edivaldo"

export function HeroSection() {
  return (
    <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0">
        <Image
          src={edivaldoContent.heroPhoto}
          alt={edivaldoContent.name}
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 h-40 w-40 overflow-hidden rounded-full border-4 border-clay-500 shadow-xl">
          <Image
            src={edivaldoContent.heroPhoto}
            alt={edivaldoContent.name}
            width={160}
            height={160}
            className="h-full w-full object-cover"
          />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-foreground md:text-5xl">{edivaldoContent.name}</h1>
        <p className="mb-1 text-xl text-clay-600 dark:text-clay-300">&quot;{edivaldoContent.nickname}&quot;</p>
        <p className="mb-8 text-foreground/70">{edivaldoContent.years}</p>
        <p className="mx-auto mb-10 max-w-xl text-lg italic text-foreground/80">{edivaldoContent.tagline}</p>
        <Button asChild size="lg" className="rounded-full bg-clay-500 px-8 text-white shadow-lg hover:bg-clay-600">
          <a href="#galeria-familia">Ver galeria da família</a>
        </Button>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Create `public/assets/img/.gitkeep`**

```
```

- [ ] **Step 6: Run it to verify it passes**

Run: `npx vitest run components/hero-section.test.tsx`
Expected: PASS (2 tests). Note: `next/image` needs a real file at `public/assets/img/edi-hero.jpg` to render without a 404 in the browser — the family will provide it; until then the `<Image>` tag renders fine in tests (jsdom does not fetch the file) and the dev server just shows a broken image icon.

- [ ] **Step 7: Commit**

```bash
git add content/edivaldo.ts components/hero-section.tsx components/hero-section.test.tsx public/assets/img/.gitkeep
git commit -m "Add content file and hero section"
```

---

### Task 8: About and Team Roping sections, shared gallery component

**Files:**
- Create: `components/about-section.tsx`
- Create: `components/gallery-section.tsx`
- Create: `components/roping-section.tsx`
- Test: `components/about-section.test.tsx`
- Test: `components/gallery-section.test.tsx`
- Test: `components/roping-section.test.tsx`

**Interfaces:**
- Consumes: `edivaldoContent` (Task 7); `GalleryImageDTO`, `listGalleryImages`, `uploadGalleryImage`, `deleteGalleryImage` (Task 5); `FamilyLoginDialog` (Task 4); `formatRelativeDate` (created in this task, see Step 1).
- Produces: `AboutSection`, `GallerySection` (props: `id: string`, `title: string`, `subtitle: string`, `category: GalleryCategory`, `addButtonLabel: string`, `initialImages: GalleryImageDTO[]`, `initialIsFamily: boolean`), `RopingSection` (props: `initialImages: GalleryImageDTO[]`, `initialIsFamily: boolean`) — consumed by `app/page.tsx` and by the family-gallery usage of `GallerySection` (Task 11).

- [ ] **Step 1: Create `lib/format.ts`**

```ts
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return "1 dia atrás"
  if (diffDays < 7) return `${diffDays} dias atrás`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} semanas atrás`
  return date.toLocaleDateString("pt-BR")
}
```

- [ ] **Step 2: Write `lib/format.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { formatRelativeDate } from "./format"

describe("formatRelativeDate", () => {
  it("formats a date from a week ago in weeks", () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeDate(eightDaysAgo)).toBe("2 semanas atrás")
  })

  it("falls back to a localized date for anything 30+ days old", () => {
    const old = new Date("2020-01-01T00:00:00Z").toISOString()
    expect(formatRelativeDate(old)).toBe(new Date(old).toLocaleDateString("pt-BR"))
  })
})
```

- [ ] **Step 3: Write `components/about-section.test.tsx`**

```tsx
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { AboutSection } from "./about-section"

describe("AboutSection", () => {
  it("shows the city, profession and bio text", () => {
    render(<AboutSection />)
    expect(screen.getByText(/guararapes - sp/i)).toBeInTheDocument()
    expect(screen.getByText(/engenheiro eletricista/i)).toBeInTheDocument()
    expect(screen.getByText(/team roping/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npx vitest run components/about-section.test.tsx`
Expected: FAIL — `Cannot find module './about-section'`.

- [ ] **Step 5: Create `components/about-section.tsx`**

```tsx
import { edivaldoContent } from "@/content/edivaldo"

export function AboutSection() {
  return (
    <section id="sobre" className="bg-background py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-center text-4xl font-bold text-foreground md:text-5xl">A história dele</h2>
        <p className="mb-4 text-center text-clay-600 dark:text-clay-300">
          {edivaldoContent.city} · {edivaldoContent.profession}
        </p>
        <p className="whitespace-pre-line text-lg leading-relaxed text-foreground/80">{edivaldoContent.bio}</p>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Run it to verify it passes**

Run: `npx vitest run components/about-section.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 7: Write `components/gallery-section.test.tsx`**

```tsx
import type { ComponentProps } from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GallerySection } from "./gallery-section"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock("@/actions/gallery", () => ({
  listGalleryImages: vi.fn(),
  uploadGalleryImage: vi.fn(),
  deleteGalleryImage: vi.fn(),
}))

const sampleImage = {
  id: "1",
  title: "Piquenique em família",
  description: null,
  category: "GERAL" as const,
  url: "https://cdn.test/family/1.jpg",
  createdAt: "2026-01-01T00:00:00Z",
}

function renderGallery(overrides: Partial<ComponentProps<typeof GallerySection>> = {}) {
  return render(
    <GallerySection
      id="galeria-familia"
      title="Galeria da Família"
      subtitle="Momentos em família"
      category="GERAL"
      addButtonLabel="Adicionar Foto"
      initialImages={[sampleImage]}
      initialIsFamily={false}
      {...overrides}
    />,
  )
}

describe("GallerySection", () => {
  it("renders the initial images passed from the server", () => {
    renderGallery()
    expect(screen.getByText("Piquenique em família")).toBeInTheDocument()
  })

  it("shows an empty state when there are no photos yet", () => {
    renderGallery({ initialImages: [] })
    expect(screen.getByText(/nenhuma foto foi adicionada ainda/i)).toBeInTheDocument()
  })

  it("prompts login instead of the upload form when not authenticated as family", async () => {
    const user = userEvent.setup()
    renderGallery({ initialImages: [] })

    await user.click(screen.getByRole("button", { name: /adicionar foto/i }))

    expect(await screen.findByText(/acesso da família/i)).toBeInTheDocument()
  })

  it("opens the upload form directly when already authenticated as family", async () => {
    const user = userEvent.setup()
    renderGallery({ initialImages: [], initialIsFamily: true })

    await user.click(screen.getByRole("button", { name: /adicionar foto/i }))

    expect(await screen.findByPlaceholderText(/título da foto/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 8: Run it to verify it fails**

Run: `npx vitest run components/gallery-section.test.tsx`
Expected: FAIL — `Cannot find module './gallery-section'`.

- [ ] **Step 9: Create `components/gallery-section.tsx`**

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Camera, ImageIcon, Loader2, Lock, Plus, Send, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FamilyLoginDialog } from "@/components/family-login-dialog"
import { deleteGalleryImage, listGalleryImages, uploadGalleryImage, type GalleryImageDTO } from "@/actions/gallery"
import { formatRelativeDate } from "@/lib/format"
import type { GalleryCategory } from "@prisma/client"

interface GallerySectionProps {
  id: string
  title: string
  subtitle: string
  category: GalleryCategory
  addButtonLabel: string
  initialImages: GalleryImageDTO[]
  initialIsFamily: boolean
}

export function GallerySection({
  id,
  title,
  subtitle,
  category,
  addButtonLabel,
  initialImages,
  initialIsFamily,
}: GallerySectionProps) {
  const router = useRouter()
  const [images, setImages] = useState(initialImages)
  const [isFamily, setIsFamily] = useState(initialIsFamily)
  const [showLogin, setShowLogin] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [title_, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<GalleryImageDTO | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsFamily(initialIsFamily)
  }, [initialIsFamily])

  const refresh = async () => {
    setImages(await listGalleryImages(category))
  }

  const handleAddClick = () => {
    if (isFamily) {
      setShowUpload(true)
    } else {
      setShowLogin(true)
    }
  }

  const handlePublish = async () => {
    if (!file || !title_.trim()) return
    setPending(true)
    setError(null)

    const formData = new FormData()
    formData.set("title", title_.trim())
    formData.set("description", description.trim())
    formData.set("file", file)

    const result = await uploadGalleryImage(category, formData)
    setPending(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setTitle("")
    setDescription("")
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setShowUpload(false)
    await refresh()
  }

  const handleDelete = async (imageId: string) => {
    await deleteGalleryImage(imageId)
    await refresh()
  }

  return (
    <section id={id} className="bg-background py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">{title}</h2>
          <p className="mb-8 text-xl text-foreground/70">{subtitle}</p>
          <Button onClick={handleAddClick}>
            {isFamily ? <Plus className="mr-2 h-5 w-5" /> : <Lock className="mr-2 h-5 w-5" />}
            {addButtonLabel}
          </Button>
        </div>

        {images.length === 0 && (
          <div className="py-12 text-center">
            <ImageIcon className="mx-auto mb-4 h-16 w-16 text-foreground/30" />
            <p className="text-lg text-foreground/50">Nenhuma foto foi adicionada ainda</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <Card key={image.id} className="group relative overflow-hidden border-0 shadow-lg">
              <button
                type="button"
                onClick={() => setSelectedImage(image)}
                className="relative block aspect-square w-full cursor-zoom-in"
              >
                <Image src={image.url} alt={image.title} fill className="object-cover" />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-4 text-left text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <h3 className="font-semibold">{image.title}</h3>
                  <p className="text-xs text-gray-200">{formatRelativeDate(image.createdAt)}</p>
                </div>
              </button>
              {isFamily && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handleDelete(image.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" /> Adicionar Foto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Input placeholder="Título da foto *" value={title_} onChange={(e) => setTitle(e.target.value)} />
            <Textarea
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {file ? file.name : "Selecionar Arquivo"}
            </Button>
            <Button className="w-full" disabled={!file || !title_.trim() || pending} onClick={handlePublish}>
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Publicar Foto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          {selectedImage && (
            <div className="space-y-3">
              <DialogHeader>
                <DialogTitle className="sr-only">{selectedImage.title}</DialogTitle>
              </DialogHeader>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                <Image src={selectedImage.url} alt={selectedImage.title} fill className="object-contain" />
              </div>
              <div className="rounded-lg bg-background/90 p-4 text-center backdrop-blur">
                <h3 className="font-semibold text-foreground">{selectedImage.title}</h3>
                {selectedImage.description && (
                  <p className="mt-1 text-sm text-foreground/70">{selectedImage.description}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FamilyLoginDialog
        open={showLogin}
        onOpenChange={setShowLogin}
        onSuccess={() => {
          setIsFamily(true)
          setShowUpload(true)
          router.refresh()
        }}
      />
    </section>
  )
}
```

- [ ] **Step 10: Run it to verify it passes**

Run: `npx vitest run components/gallery-section.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 11: Write `components/roping-section.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { RopingSection } from "./roping-section"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock("@/actions/gallery", () => ({
  listGalleryImages: vi.fn(),
  uploadGalleryImage: vi.fn(),
  deleteGalleryImage: vi.fn(),
}))

describe("RopingSection", () => {
  it("shows the Team Roping club name and an empty gallery state", () => {
    render(<RopingSection initialImages={[]} initialIsFamily={false} />)
    expect(screen.getByText(/team roping/i)).toBeInTheDocument()
    expect(screen.getByText(/nenhuma foto foi adicionada ainda/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 12: Run it to verify it fails**

Run: `npx vitest run components/roping-section.test.tsx`
Expected: FAIL — `Cannot find module './roping-section'`.

- [ ] **Step 13: Create `components/roping-section.tsx`**

```tsx
import { edivaldoContent } from "@/content/edivaldo"
import { GallerySection } from "@/components/gallery-section"
import type { GalleryImageDTO } from "@/actions/gallery"

interface RopingSectionProps {
  initialImages: GalleryImageDTO[]
  initialIsFamily: boolean
}

export function RopingSection({ initialImages, initialIsFamily }: RopingSectionProps) {
  return (
    <div className="bg-campo-50 dark:bg-campo-950/40">
      <div className="mx-auto max-w-3xl px-4 pt-20 text-center sm:px-6 lg:px-8">
        <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">{edivaldoContent.ropingClub}</h2>
        <p className="text-lg text-foreground/80">
          A paixão pelo laço em dupla e pela vida no campo, ao lado dos amigos do clube.
        </p>
      </div>
      <GallerySection
        id="team-roping"
        title="Fotos do Team Roping"
        subtitle="Treinos, competições e amigos do clube"
        category="ROPING"
        addButtonLabel="Adicionar Foto"
        initialImages={initialImages}
        initialIsFamily={initialIsFamily}
      />
    </div>
  )
}
```

- [ ] **Step 14: Run it to verify it passes**

Run: `npx vitest run components/roping-section.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 15: Commit**

```bash
git add lib/format.ts lib/format.test.ts components/about-section.tsx components/about-section.test.tsx components/gallery-section.tsx components/gallery-section.test.tsx components/roping-section.tsx components/roping-section.test.tsx
git commit -m "Add about section, shared gallery component, and Team Roping section"
```

---

### Task 9: Testimonials wall section

**Files:**
- Create: `components/testimonials-section.tsx`
- Test: `components/testimonials-section.test.tsx`

**Interfaces:**
- Consumes: `TestimonialDTO`, `listTestimonials`, `addTestimonial`, `likeTestimonial`, `deleteTestimonial` (Task 6); `formatRelativeDate` (Task 8).
- Produces: `TestimonialsSection` (props: `initialTestimonials: TestimonialDTO[]`, `initialIsFamily: boolean`) — consumed by `app/page.tsx` (Task 11).

- [ ] **Step 1: Write `components/testimonials-section.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TestimonialsSection } from "./testimonials-section"

vi.mock("@/actions/testimonials", () => ({
  listTestimonials: vi.fn(),
  addTestimonial: vi.fn(),
  likeTestimonial: vi.fn(),
  deleteTestimonial: vi.fn(),
}))

import { addTestimonial, likeTestimonial, listTestimonials } from "@/actions/testimonials"

const sampleTestimonial = {
  id: "1",
  name: "Amigo do clube",
  message: "Vai fazer muita falta nos treinos",
  likes: 2,
  likedBy: [],
  createdAt: "2026-01-01T00:00:00Z",
}

describe("TestimonialsSection", () => {
  it("renders existing testimonials without requiring the family password", () => {
    render(<TestimonialsSection initialTestimonials={[sampleTestimonial]} initialIsFamily={false} />)
    expect(screen.getByText("Amigo do clube")).toBeInTheDocument()
    expect(screen.getByText("Vai fazer muita falta nos treinos")).toBeInTheDocument()
  })

  it("lets any visitor submit a new testimonial without logging in", async () => {
    const user = userEvent.setup()
    vi.mocked(addTestimonial).mockResolvedValue({ error: null })
    vi.mocked(listTestimonials).mockResolvedValue([])
    render(<TestimonialsSection initialTestimonials={[]} initialIsFamily={false} />)

    await user.type(screen.getByPlaceholderText("Seu nome"), "Maria")
    await user.type(screen.getByPlaceholderText(/compartilhe uma memória/i), "Com carinho")
    await user.click(screen.getByRole("button", { name: /enviar mensagem/i }))

    expect(addTestimonial).toHaveBeenCalledWith("Maria", "Com carinho")
  })

  it("lets any visitor like a testimonial without logging in", async () => {
    const user = userEvent.setup()
    vi.mocked(likeTestimonial).mockResolvedValue({ error: null })
    vi.mocked(listTestimonials).mockResolvedValue([sampleTestimonial])
    render(<TestimonialsSection initialTestimonials={[sampleTestimonial]} initialIsFamily={false} />)

    await user.click(screen.getByRole("button", { name: /2/ }))

    expect(likeTestimonial).toHaveBeenCalledWith("1", expect.any(String))
  })

  it("only shows the delete button for family sessions", () => {
    const { rerender } = render(
      <TestimonialsSection initialTestimonials={[sampleTestimonial]} initialIsFamily={false} />,
    )
    expect(screen.queryByRole("button", { name: /excluir depoimento/i })).not.toBeInTheDocument()

    rerender(<TestimonialsSection initialTestimonials={[sampleTestimonial]} initialIsFamily={true} />)
    expect(screen.getByRole("button", { name: /excluir depoimento/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/testimonials-section.test.tsx`
Expected: FAIL — `Cannot find module './testimonials-section'`.

- [ ] **Step 3: Create `components/testimonials-section.tsx`**

```tsx
"use client"

import { useState } from "react"
import { Heart, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  addTestimonial,
  deleteTestimonial,
  likeTestimonial,
  listTestimonials,
  type TestimonialDTO,
} from "@/actions/testimonials"
import { formatRelativeDate } from "@/lib/format"

interface TestimonialsSectionProps {
  initialTestimonials: TestimonialDTO[]
  initialIsFamily: boolean
}

function getSessionId(): string {
  if (typeof window === "undefined") return "server"
  let id = window.localStorage.getItem("edi-session-id")
  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem("edi-session-id", id)
  }
  return id
}

export function TestimonialsSection({ initialTestimonials, initialIsFamily }: TestimonialsSectionProps) {
  const [mural, setMural] = useState(initialTestimonials)
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")

  const refresh = async () => {
    setMural(await listTestimonials())
  }

  const handleAdd = async () => {
    if (!name.trim() || !message.trim()) return
    const result = await addTestimonial(name, message)
    if (!result.error) {
      setName("")
      setMessage("")
      await refresh()
    }
  }

  const handleLike = async (testimonialId: string) => {
    await likeTestimonial(testimonialId, getSessionId())
    await refresh()
  }

  const handleDelete = async (testimonialId: string) => {
    await deleteTestimonial(testimonialId)
    await refresh()
  }

  return (
    <section id="depoimentos" className="bg-campo-50 py-20 dark:bg-campo-950/40">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-center text-4xl font-bold text-foreground md:text-5xl">Mural de Depoimentos</h2>
        <p className="mb-12 text-center text-xl text-foreground/70">
          Qualquer amigo pode deixar uma mensagem — não precisa de senha.
        </p>

        <Card className="mb-8 border-0 bg-card shadow-lg">
          <CardContent className="space-y-3 p-6">
            <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea
              placeholder="Compartilhe uma memória especial..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button className="w-full" onClick={handleAdd}>
              <Send className="mr-2 h-4 w-4" /> Enviar Mensagem
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {mural.map((testimonial) => (
            <Card key={testimonial.id} className="border-0 bg-card shadow-md">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{testimonial.name}</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleLike(testimonial.id)}>
                      <Heart className="mr-1 h-4 w-4" /> {testimonial.likes}
                    </Button>
                    {initialIsFamily && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Excluir depoimento"
                        onClick={() => handleDelete(testimonial.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-foreground/80">{testimonial.message}</p>
                <p className="mt-2 text-xs text-foreground/50">{formatRelativeDate(testimonial.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run components/testimonials-section.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/testimonials-section.tsx components/testimonials-section.test.tsx
git commit -m "Add testimonials wall, open to all visitors with anonymous likes"
```

---

### Task 10: Navigation and Footer

**Files:**
- Create: `components/navigation.tsx`
- Create: `components/footer.tsx`
- Test: `components/navigation.test.tsx`
- Test: `components/footer.test.tsx`

**Interfaces:**
- Consumes: `logoutFamily` (Task 4), `edivaldoContent` (Task 7).
- Produces: `Navigation` (props: `isFamily: boolean`), `Footer` — consumed by `app/page.tsx` (Task 11).

- [ ] **Step 1: Write `components/navigation.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Navigation } from "./navigation"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}))

vi.mock("@/actions/family-auth", () => ({
  logoutFamily: vi.fn(),
}))

describe("Navigation", () => {
  it("shows the family badge and logout button only when authenticated as family", () => {
    const { rerender } = render(<Navigation isFamily={false} />)
    expect(screen.queryByRole("button", { name: /sair/i })).not.toBeInTheDocument()

    rerender(<Navigation isFamily={true} />)
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument()
  })

  it("lists anchor links to every section", () => {
    render(<Navigation isFamily={false} />)
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "#home")
    expect(screen.getByRole("link", { name: "Team Roping" })).toHaveAttribute("href", "#team-roping")
    expect(screen.getByRole("link", { name: "Depoimentos" })).toHaveAttribute("href", "#depoimentos")
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/navigation.test.tsx`
Expected: FAIL — `Cannot find module './navigation'`.

- [ ] **Step 3: Create `components/navigation.tsx`**

```tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, LogOut, Moon, Shield, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
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
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setIsFamily(initialIsFamily)
  }, [initialIsFamily])

  const handleLogout = async () => {
    await logoutFamily()
    setIsFamily(false)
    router.refresh()
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-clay-500" />
          <span className="font-serif text-lg font-bold text-foreground">Edi Correa</span>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-foreground/70 hover:text-foreground">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isFamily && (
            <>
              <Badge variant="secondary">
                <Shield className="mr-1 h-3 w-3" /> Família
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1 h-3 w-3" /> Sair
              </Button>
            </>
          )}
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-foreground/60" />
            <Switch
              checked={mounted && theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
            <Moon className="h-4 w-4 text-foreground/60" />
          </div>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run components/navigation.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Write `components/footer.test.tsx`**

```tsx
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Footer } from "./footer"

describe("Footer", () => {
  it("shows the name in memoriam", () => {
    render(<Footer />)
    expect(screen.getByText(/edivaldo junior/i)).toBeInTheDocument()
  })

  it("links to the developer's contact channels", () => {
    render(<Footer />)
    expect(screen.getByRole("link", { name: /ctsctiago@gmail.com/i })).toHaveAttribute(
      "href",
      "mailto:ctsctiago@gmail.com",
    )
  })
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run components/footer.test.tsx`
Expected: FAIL — `Cannot find module './footer'`.

- [ ] **Step 7: Create `components/footer.tsx`**

```tsx
import { Globe, Heart, Mail, MessageCircle } from "lucide-react"
import { edivaldoContent } from "@/content/edivaldo"

const DEVELOPER_CONTACT = {
  whatsapp: { href: "https://wa.me/5567992825522", label: "(67) 99282-5522" },
  email: { href: "mailto:ctsctiago@gmail.com", label: "ctsctiago@gmail.com" },
  site: { href: "https://www.tiagocostadev.com.br/", label: "tiagocostadev.com.br" },
}

export function Footer() {
  return (
    <footer className="mt-auto bg-clay-900 py-12 text-clay-50">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 text-clay-300" />
          <span className="font-serif text-2xl font-bold">{edivaldoContent.name}</span>
        </div>
        <p className="mx-auto mb-4 max-w-xl italic text-clay-200">&quot;{edivaldoContent.tagline}&quot;</p>
        <div className="mb-6 text-xs text-clay-400">Memorial criado com amor pela família e pelos amigos</div>

        <div className="mx-auto max-w-md border-t border-clay-700/60 pt-6">
          <p className="mb-3 text-xs text-clay-400">Quer um memorial digital como este para sua família?</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-clay-200">
            <a
              href={DEVELOPER_CONTACT.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <MessageCircle className="h-4 w-4" />
              {DEVELOPER_CONTACT.whatsapp.label}
            </a>
            <a href={DEVELOPER_CONTACT.email.href} className="flex items-center gap-1.5 transition-colors hover:text-white">
              <Mail className="h-4 w-4" />
              {DEVELOPER_CONTACT.email.label}
            </a>
            <a
              href={DEVELOPER_CONTACT.site.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-white"
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
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx vitest run components/footer.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
git add components/navigation.tsx components/navigation.test.tsx components/footer.tsx components/footer.test.tsx
git commit -m "Add navigation and footer"
```

---

### Task 11: Wire the home page together

**Files:**
- Create: `app/page.tsx`
- Test: `app/page.test.tsx`

**Interfaces:**
- Consumes: every component and Server Action from Tasks 4–10.
- Produces: the default export of `app/page.tsx`, the site's single route.

- [ ] **Step 1: Write `app/page.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@/actions/gallery", () => ({
  listGalleryImages: vi.fn().mockResolvedValue([]),
}))
vi.mock("@/actions/testimonials", () => ({
  listTestimonials: vi.fn().mockResolvedValue([]),
}))
vi.mock("@/lib/auth/get-family-session", () => ({
  getFamilySession: vi.fn().mockResolvedValue(false),
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}))

import MemorialPage from "./page"

describe("MemorialPage", () => {
  it("renders the hero, roping, gallery, and testimonials sections together", async () => {
    render(await MemorialPage())

    expect(screen.getByRole("heading", { name: /edivaldo junior/i })).toBeInTheDocument()
    expect(screen.getAllByText(/team roping/i).length).toBeGreaterThan(0)
    expect(screen.getByRole("heading", { name: /galeria da família/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /mural de depoimentos/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run app/page.test.tsx`
Expected: FAIL — `Cannot find module './page'`.

- [ ] **Step 3: Create `app/page.tsx`**

```tsx
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { RopingSection } from "@/components/roping-section"
import { GallerySection } from "@/components/gallery-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { listGalleryImages } from "@/actions/gallery"
import { listTestimonials } from "@/actions/testimonials"
import { getFamilySession } from "@/lib/auth/get-family-session"

export default async function MemorialPage() {
  const [isFamily, generalImages, ropingImages, testimonials] = await Promise.all([
    getFamilySession(),
    listGalleryImages("GERAL"),
    listGalleryImages("ROPING"),
    listTestimonials(),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation isFamily={isFamily} />
      <HeroSection />
      <AboutSection />
      <RopingSection initialImages={ropingImages} initialIsFamily={isFamily} />
      <GallerySection
        id="galeria-familia"
        title="Galeria da Família"
        subtitle="Momentos com a família e os amigos"
        category="GERAL"
        addButtonLabel="Adicionar Foto"
        initialImages={generalImages}
        initialIsFamily={isFamily}
      />
      <TestimonialsSection initialTestimonials={testimonials} initialIsFamily={isFamily} />
      <Footer />
    </div>
  )
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run app/page.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Run the full test suite and the dev server**

Run: `npm test`
Expected: every test in the project passes.

Run: `npm run dev`, open `http://localhost:3000`
Expected: the page renders hero → about → Team Roping (with empty-state gallery) → family gallery (empty-state) → testimonials wall → footer, in the rustic-modern palette from Task 1, with a working dark-mode switch in the nav and no console errors (Cloudinary/Neon calls will fail without real env vars — see Task 12 for wiring `.env.local`, this step just confirms the page renders and layout looks right with the empty-state UI).

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/page.test.tsx
git commit -m "Wire hero, about, Team Roping, gallery, and testimonials into the home page"
```

---

### Task 12: README, environment wiring, and final build verification

**Files:**
- Create: `README.md`
- Modify: `.env.example` (already created in Task 3 — verify it lists every variable used across the project)

**Interfaces:**
- None (documentation and verification only).

- [ ] **Step 1: Create `README.md`**

```markdown
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
   - `SESSION_SECRET` — qualquer string longa e aleatória.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
5. `npx prisma generate && npx prisma db push` (cria as tabelas no Neon a
   partir de `prisma/schema.prisma`).
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
```

- [ ] **Step 2: Verify `.env.example` lists every variable used in the project**

Run: `grep -o "process\.env\.[A-Z_]*" -r lib actions | sort -u` (or, on Windows PowerShell: `Select-String -Path lib\*,actions\* -Pattern "process\.env\.[A-Z_]+" -Recurse | Select-String -Pattern "[A-Z_]+" | Sort-Object -Unique`)
Expected: the only variables referenced are `DATABASE_URL`, `FAMILY_PASSWORD_HASH`, `SESSION_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NODE_ENV` — all six non-`NODE_ENV` variables must already be listed in `.env.example` from Task 3. If any is missing, add it.

- [ ] **Step 3: Run the full verification pass**

Run: `npm install && npx prisma validate && npm run build && npm test`
Expected: `prisma validate` succeeds, `next build` completes with no type errors, and every test in the project passes.

- [ ] **Step 4: Commit**

```bash
git add README.md .env.example
git commit -m "Add README with setup and deploy instructions"
```
