import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForgotPasswordForm from "@/app/auth/forgot-password/page";
import "@testing-library/jest-dom";

global.fetch = jest.fn();

describe("ForgotPasswordForm Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the form correctly", () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByText("Forgot Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Enter your email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("allows the user to type an email", () => {
    render(<ForgotPasswordForm />);
    const input = screen.getByLabelText("Enter your email") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "user@example.com" } });

    expect(input.value).toBe("user@example.com");
  });

  it("submits the form and shows success message on valid response", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Reset link sent." }),
    });

    render(<ForgotPasswordForm />);
    const input = screen.getByLabelText("Enter your email");
    const button = screen.getByRole("button", { name: /send reset link/i });

    fireEvent.change(input, { target: { value: "user@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Reset link sent.")).toBeInTheDocument();
    });
  });

  it("shows an error message when server returns error", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Email not found." }),
    });

    render(<ForgotPasswordForm />);
    const input = screen.getByLabelText("Enter your email");
    const button = screen.getByRole("button", { name: /send reset link/i });

    fireEvent.change(input, { target: { value: "notfound@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Email not found.")).toBeInTheDocument();
    });
  });

  it("shows a network error on fetch failure", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<ForgotPasswordForm />);
    const input = screen.getByLabelText("Enter your email");
    const button = screen.getByRole("button", { name: /send reset link/i });

    fireEvent.change(input, { target: { value: "fail@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("Network error: could not request a password reset.")
      ).toBeInTheDocument();
    });
  });
});
