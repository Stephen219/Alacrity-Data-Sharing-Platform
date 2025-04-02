/* eslint-disable @typescript-eslint/no-explicit-any */


import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SignInForm from "@/components/SignInForm";
import "@testing-library/jest-dom";
import { login } from "@/libs/auth";

jest.mock("next/image", () => {
  const MockImage = (props: { src: string; alt: string }) => {
    return <img {...props} />;
  };
  MockImage.displayName = "MockNextImage";
  return MockImage;
});


jest.mock("@/libs/auth", () => ({
  login: jest.fn(),
}));

describe("SignInForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the SignInForm component correctly", () => {
    render(<SignInForm />);
    
    expect(screen.getByText("Welcome Back!")).toBeInTheDocument();
    expect(screen.getByLabelText("Your email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  test("allows the user to type an email and password", () => {
    render(<SignInForm />);
    
    const emailInput = screen.getByLabelText("Your email");
    const passwordInput = screen.getByLabelText("Password");
    
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    
    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });



  test("clicking the sign-in button is possible", () => {
    render(<SignInForm />);
    
    const signInButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(signInButton);
    
    expect(signInButton).toBeInTheDocument();
  });

  test("submits form successfully and redirects", async () => {
   
    (login as jest.Mock).mockResolvedValue({ success: true });
    
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });

    render(<SignInForm />);
    
    const emailInput = screen.getByLabelText("Your email");
    const passwordInput = screen.getByLabelText("Password");
    const signInButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(signInButton);

    await screen.findByRole("button", { name: /sign in/i }); // Wait for async submission

    expect(login).toHaveBeenCalledWith("test@example.com", "password123", false);
    expect(window.location.href).toBe("/feed");
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
    // Restore window.location
    window.location.href = originalLocation.href;
  });

  test("displays error message on login failure", async () => {
    // Mock failed login
    (login as jest.Mock).mockResolvedValue({ success: false, error: "Invalid credentials" });

    render(<SignInForm />);
    
    const emailInput = screen.getByLabelText("Your email");
    const passwordInput = screen.getByLabelText("Password");
    const signInButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    fireEvent.click(signInButton);

    const errorMessage = await screen.findByText("Invalid credentials");
    expect(errorMessage).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith("test@example.com", "wrongpassword", false);
  });
});
