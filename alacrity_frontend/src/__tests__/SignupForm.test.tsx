import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import SignUp from "../components/signup";
import '@testing-library/jest-dom';

// Mock the `useRouter` hook
jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: {
      get: () => "application/json",
    },
    json: () => Promise.resolve({ message: "Form submitted successfully" }),
  } as unknown as Response)
);

describe("SignUp Form", () => {
  beforeEach(() => {
    render(<SignUp />);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const fillForm = ({
    firstName = "John",
    surname = "Doe",
    phoneNumber = "12345678901",
    email = "john.doe@example.com",
    password = "Password123!",
    confirmPassword = "Password123!",
    field = "Software Engineering"
  } = {}) => {
    fireEvent.change(screen.getByPlaceholderText("John"), {
      target: { value: firstName },
    });
    fireEvent.change(screen.getByPlaceholderText("Doe"), {
      target: { value: surname },
    });
    fireEvent.change(screen.getByPlaceholderText("12345678901"), {
      target: { value: phoneNumber },
    });
    fireEvent.change(screen.getByPlaceholderText("john.doe@example.com"), {
      target: { value: email },
    });
    const passwordFields = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordFields[0], {
      target: { value: password },
    });
    fireEvent.change(passwordFields[1], {
      target: { value: confirmPassword },
    });
    fireEvent.change(screen.getByPlaceholderText("Your field of expertise"), {
      target: { value: field },
    });
  };

  it("should display validation error if required fields are missing", async () => {
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));
    await waitFor(() => {
      const errorElement = screen.getByTestId("error-message");
      expect(errorElement).toHaveAttribute('aria-hidden', 'false');
      expect(errorElement).toHaveTextContent(/All fields must be filled/i);
    });
  });

  it("should display an error if the email is invalid", async () => {
    fillForm(); // Fill all fields with valid data first
    
    // Change email to invalid format
    fireEvent.change(screen.getByPlaceholderText("john.doe@example.com"), {
      target: { value: "invalid-email" },
    });
    
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));
    
    await waitFor(() => {
      const errorElement = screen.getByTestId("error-message");
      expect(errorElement).toHaveAttribute('aria-hidden', 'false');
      expect(errorElement).toHaveTextContent(/Please enter a valid email address/i);
    });
  });

  it("should display an error if the passwords do not match", async () => {
    fillForm({ password: "Password123!", confirmPassword: "DifferentPassword123!" });
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));
    
    await waitFor(() => {
      const errorElement = screen.getByTestId("error-message");
      expect(errorElement).toHaveAttribute('aria-hidden', 'false');
      expect(errorElement).toHaveTextContent(/Passwords do not match/i);
    });
  });

  it("should disable button and show loading state during form submission", async () => {
    fillForm();
    const signUpButton = screen.getByRole("button", { name: /Sign Up/i });
    fireEvent.click(signUpButton);

    await waitFor(() => {
      expect(signUpButton).toBeDisabled();
      expect(signUpButton).toHaveTextContent(/Signing Up.../i);
    });
  });

  it("should submit the form if all fields are valid", async () => {
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    await waitFor(() => {
      const successElement = screen.getByTestId("success-message");
      expect(successElement).toHaveAttribute('aria-hidden', 'false');
      expect(successElement).toHaveTextContent(/Form submitted successfully/i);
    });
  });

  it("should display an error message if server returns an error", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.resolve({ message: "Something went wrong" }),
      } as unknown as Response)
    );

    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    await waitFor(() => {
      const errorElement = screen.getByTestId("error-message");
      expect(errorElement).toHaveAttribute('aria-hidden', 'false');
      expect(errorElement).toHaveTextContent(/Something went wrong/i);
    });
  });
});