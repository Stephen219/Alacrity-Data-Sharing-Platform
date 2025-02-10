import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import SignUp from "../components/signup";
import '@testing-library/jest-dom/extend-expect';



// Mock the `useRouter` hook from Next.js to prevent actual routing in tests
jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

describe("SignUp Form", () => {
  beforeEach(() => {
    render(<SignUp />);
  });

  it("should display validation error if required fields are missing", () => {
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    expect(screen.getByText(/All fields must be filled/i)).toBeInTheDocument();
  });

  it("should display an error if the email is invalid", () => {
    fireEvent.change(screen.getByPlaceholderText("john.doe@example.com"), {
      target: { value: "invalid-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
  });

  it("should display an error if the passwords do not match", () => {
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm password"), {
        target: { value: "DifferentPassword123!" },
      });
      
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  it("should submit the form if all fields are valid", async () => {
    fireEvent.change(screen.getByPlaceholderText("John"), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText("Doe"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("12345678901"), {
      target: { value: "12345678901" },
    });
    fireEvent.change(screen.getByPlaceholderText("john.doe@example.com"), {
      target: { value: "john.doe@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "Password123!", name: "confirmPassword" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your field of expertise"), {
      target: { value: "Software Engineering" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    await waitFor(() => {
      expect(screen.getByText(/Form is valid!/i)).toBeInTheDocument();
    });
  });
});
