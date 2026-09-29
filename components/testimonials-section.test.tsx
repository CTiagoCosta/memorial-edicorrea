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

import { addTestimonial, deleteTestimonial, likeTestimonial, listTestimonials } from "@/actions/testimonials"

const sampleTestimonial = {
  id: "1",
  name: "Amigo do clube",
  message: "Vai fazer muita falta nos treinos",
  likes: 2,
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

  it("shows an error and keeps the draft when submitting rejects", async () => {
    const user = userEvent.setup()
    vi.mocked(addTestimonial).mockRejectedValueOnce(new Error("network down"))
    render(<TestimonialsSection initialTestimonials={[]} initialIsFamily={false} />)

    await user.type(screen.getByPlaceholderText("Seu nome"), "Maria")
    await user.type(screen.getByPlaceholderText(/compartilhe uma memória/i), "Com carinho")
    await user.click(screen.getByRole("button", { name: /enviar mensagem/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/não foi possível enviar/i)
    expect(screen.getByPlaceholderText("Seu nome")).toHaveValue("Maria")
  })

  it("asks for confirmation before deleting a testimonial, and does nothing if declined", async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false)
    render(<TestimonialsSection initialTestimonials={[sampleTestimonial]} initialIsFamily={true} />)

    await user.click(screen.getByRole("button", { name: /excluir depoimento/i }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(deleteTestimonial).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it("deletes the testimonial when the confirmation is accepted", async () => {
    const user = userEvent.setup()
    vi.spyOn(window, "confirm").mockReturnValue(true)
    vi.mocked(deleteTestimonial).mockResolvedValue({ error: null })
    vi.mocked(listTestimonials).mockResolvedValue([])
    render(<TestimonialsSection initialTestimonials={[sampleTestimonial]} initialIsFamily={true} />)

    await user.click(screen.getByRole("button", { name: /excluir depoimento/i }))

    expect(deleteTestimonial).toHaveBeenCalledWith("1")
    vi.restoreAllMocks()
  })

  it("does not show a 'read more' trigger for short testimonials", () => {
    render(<TestimonialsSection initialTestimonials={[sampleTestimonial]} initialIsFamily={false} />)
    expect(screen.queryByRole("button", { name: /ler depoimento completo/i })).not.toBeInTheDocument()
  })

  it("opens the full message in a dialog for long testimonials", async () => {
    const user = userEvent.setup()
    const longTestimonial = { ...sampleTestimonial, id: "2", message: "Muita saudade. ".repeat(20) }
    render(<TestimonialsSection initialTestimonials={[longTestimonial]} initialIsFamily={false} />)

    await user.click(screen.getByRole("button", { name: /ler depoimento completo/i }))

    expect(screen.getByRole("dialog")).toHaveTextContent(longTestimonial.message)
  })

  it("shows only the 6 most recent testimonials until 'ver todos' is clicked", async () => {
    const user = userEvent.setup()
    const many = Array.from({ length: 8 }, (_, i) => ({
      ...sampleTestimonial,
      id: `${i + 1}`,
      name: `Amigo ${i + 1}`,
    }))
    render(<TestimonialsSection initialTestimonials={many} initialIsFamily={false} />)

    expect(screen.getAllByText(/^Amigo \d$/)).toHaveLength(6)
    expect(screen.queryByText("Amigo 7")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /ver todos os depoimentos \(8\)/i }))

    expect(screen.getByText("Amigo 7")).toBeInTheDocument()
    expect(screen.getByText("Amigo 8")).toBeInTheDocument()
  })

  it("does not show the 'ver todos' button when there are 6 or fewer testimonials", () => {
    render(<TestimonialsSection initialTestimonials={[sampleTestimonial]} initialIsFamily={false} />)
    expect(screen.queryByRole("button", { name: /ver todos os depoimentos/i })).not.toBeInTheDocument()
  })
})
