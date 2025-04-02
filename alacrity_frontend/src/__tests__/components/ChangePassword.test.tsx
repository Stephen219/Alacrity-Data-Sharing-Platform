import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ChangePassword from "@/components/ChangePassword";
import { fetchWithAuth } from "@/libs/auth";

// Mocks using fetchWithAuth to control API responses
jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
}));

describe("ChangePassword component", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders the component (checks heading)", () => {
    render(<ChangePassword />);
    expect(screen.getByRole("heading", { name: /change password/i })).toBeInTheDocument();
  });

  it("shows an error if new password does not meet criteria", async () => {
    render(<ChangePassword />);
    fireEvent.change(screen.getByLabelText(/Current Password/i), {
      target: { value: "OldPassword123!" },
    });
    // Enters an invalid new password
    fireEvent.change(screen.getByLabelText(/New Password/i), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    expect(await screen.findByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
  });

  it("shows an error if new and confirm passwords do not match", async () => {
    render(<ChangePassword />);
    fireEvent.change(screen.getByLabelText(/Current Password/i), {
      target: { value: "OldPassword123!" },
    });
    fireEvent.change(screen.getByLabelText(/New Password/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "DifferentPass123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    expect(await screen.findByText(/new password and confirm password do not match/i)).toBeInTheDocument();
  });

  it("calls API and shows success message on successful password change, and clears the form", async () => {
    // Mock a successful API call
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Password updated successfully." }),
    });

    render(<ChangePassword />);
    const oldPasswordInput = screen.getByLabelText(/Current Password/i);
    const newPasswordInput = screen.getByLabelText(/New Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const submitButton = screen.getByRole("button", { name: /change password/i });

    // Enter valid inputs
    fireEvent.change(oldPasswordInput, { target: { value: "OldPassword123!" } });
    fireEvent.change(newPasswordInput, { target: { value: "NewPassword123!" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "NewPassword123!" } });

    fireEvent.click(submitButton);

    // Wait for success message and check that the form is cleared
    expect(await screen.findByText(/password updated successfully/i)).toBeInTheDocument();
    expect((oldPasswordInput as HTMLInputElement).value).toBe("");
    expect((newPasswordInput as HTMLInputElement).value).toBe("");
    expect((confirmPasswordInput as HTMLInputElement).value).toBe("");
  });

  it("shows an error message on API failure", async () => {
    // Mock a failed API call
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Error updating password." }),
    });

    render(<ChangePassword />);
    fireEvent.change(screen.getByLabelText(/Current Password/i), {
      target: { value: "OldPassword123!" },
    });
    fireEvent.change(screen.getByLabelText(/New Password/i), {
      target: { value: "NewPassword123!" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "NewPassword123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    expect(await screen.findByText(/error updating password/i)).toBeInTheDocument();
  });
});
