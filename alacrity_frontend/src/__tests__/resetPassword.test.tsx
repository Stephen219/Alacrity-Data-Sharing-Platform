import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResetPasswordForm from "@/app/reset-password/page";
import { useSearchParams } from "next/navigation";

// Mock useSearchParams
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn();

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders form correctly", () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === "uidb64" ? "testUid" : "testToken"),
    });

    render(<ResetPasswordForm />);

    expect(screen.getByText(/Change Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reset Password/i })).toBeInTheDocument();
  });

  test("shows error if URL params are missing", () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => null, // Simulates missing query params
    });

    render(<ResetPasswordForm />);

    expect(screen.getByText(/Invalid password reset link/i)).toBeInTheDocument();
  });

  test("shows error when passwords do not match", () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === "uidb64" ? "testUid" : "testToken"),
    });
  
    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: "Password1!" } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: "DifferentPassword!" } });
    fireEvent.click(screen.getByLabelText(/I accept the/i));
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));
  
    expect(screen.queryByText((text) => text.includes("Passwords do not match"))).toBeInTheDocument();
  });
  

  test("validates password strength", () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === "uidb64" ? "testUid" : "testToken"),
    });
  
    render(<ResetPasswordForm />);
  
    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: "weak" } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: "weak" } });
    fireEvent.click(screen.getByLabelText(/I accept the/i));
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));
  
    expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
  });
  

  test("calls API and handles success", async () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === "uidb64" ? "testUid" : "testToken"),
    });
  
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ message: "Password reset successful." }),
    });
  
    render(<ResetPasswordForm />);
  
    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: "StrongPass1!" } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: "StrongPass1!" } });
    
    // Check the required checkbox
    fireEvent.click(screen.getByLabelText(/I accept the/i));
  
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));
  
    await waitFor(() => expect(screen.getByText(/Password reset successful/i)).toBeInTheDocument());
  });
  

  test("calls API and handles failure", async () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === "uidb64" ? "testUid" : "testToken"),
    });
  
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "Failed to reset password." }),
    });
  
    render(<ResetPasswordForm />);
  
    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: "StrongPass1!" } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: "StrongPass1!" } });
  
    // Ensure the checkbox is clicked
    fireEvent.click(screen.getByLabelText(/I accept the/i));
  
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));
  
    await waitFor(() =>
      expect(screen.getByText(/Failed to reset password/i)).toBeInTheDocument()
    );
  });
  
  test("displays success message after reset", async () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === "uidb64" ? "testUid" : "testToken"),
    });
  
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ message: "Password reset successful." }),
    });
  
    render(<ResetPasswordForm />);
  
    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: "StrongPass1!" } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: "StrongPass1!" } });
  
    // Ensure the checkbox is clicked
    fireEvent.click(screen.getByLabelText(/I accept the/i));
  
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));
  
    await waitFor(() =>
      expect(screen.getByText(/Password reset successful/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });
  
});
