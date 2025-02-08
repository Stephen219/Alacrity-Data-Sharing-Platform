import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SignInForm from "@/components/SignInForm";
import "@testing-library/jest-dom";

jest.mock("next/image", () => {
    const MockImage = (props: { src: string; alt: string }) => {
      return <img {...props} />;
    };
    MockImage.displayName = "MockNextImage";
    return MockImage;
  });

describe("SignInForm Component", () => {
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

  test("renders a working remember me checkbox", () => {
    render(<SignInForm />);
    
    const checkbox = screen.getByLabelText("Remember me");
    expect(checkbox).not.toBeChecked();
    
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  test("clicking the sign-in button is possible", () => {
    render(<SignInForm />);
    
    const signInButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(signInButton);
    
    expect(signInButton).toBeInTheDocument();
  });
});
