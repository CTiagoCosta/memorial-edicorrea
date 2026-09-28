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
