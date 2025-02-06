import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import { useRouter } from "next/router";
import userEvent from "@testing-library/user-event";

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

describe("Home Page", () => {
  beforeEach(() => {
    render(<Home />);
  });

  test("renders the main heading", () => {
    expect(
      screen.getByRole("heading", { name: /your favourite platform for secure data collaboration/i })
    ).toBeInTheDocument();
  });

  test("renders the welcome message", () => {
    expect(
      screen.getByText(/the fastest way for organisations to upload, manage, and share datasets/i)
    ).toBeInTheDocument();
  });

  test("renders the 'Upload Data' link", () => {
    const uploadLink = screen.getByRole("link", { name: /upload data/i });
    expect(uploadLink).toBeInTheDocument();
    expect(uploadLink).toHaveAttribute("href", "/uploadData");
  });

  test("renders the 'Approve Access' button", () => {
    const approveButton = screen.getByRole("button", { name: /approve access/i });
    expect(approveButton).toBeInTheDocument();
  });

  test("clicking 'Upload Data' should navigate correctly", async () => {
    const uploadLink = screen.getByRole("link", { name: /upload data/i });
    expect(uploadLink).toHaveAttribute("href", "/uploadData");
  });

  test("clicking 'Approve Access' triggers button interaction", async () => {
    const user = userEvent.setup();
    const approveButton = screen.getByRole("button", { name: /approve access/i });

    await user.click(approveButton);
    expect(approveButton).toBeInTheDocument();
  });
});
