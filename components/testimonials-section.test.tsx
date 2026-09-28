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
