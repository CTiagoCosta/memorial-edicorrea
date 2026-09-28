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
