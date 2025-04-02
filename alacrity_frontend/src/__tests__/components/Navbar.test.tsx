import React from "react";
import { render, screen, act } from "@testing-library/react";
import Navbar from "@/components/Navbar";
import "@testing-library/jest-dom";

jest.mock("lucide-react", () => ({
  Bell: () => <svg data-testid="bell-icon" />,
  Menu: () => <svg data-testid="menu-icon" />,
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}));

jest.mock("@/components/ui/button", () => ({
  buttonVariants: jest.fn(() => "mock-button-class"),
}));

jest.mock("@/components/ui/ModeToggle", () => ({
  ModeToggle: () => <div data-testid="mode-toggle" />,
}));

jest.mock("@/libs/auth", () => ({
  fetchUserData: jest.fn(() =>
    Promise.resolve({
      role: "researcher",
      firstname: "TestUser",
    })
  ),
}));

describe("Navbar Component", () => {
  const mockToggleSidebar = jest.fn();

  test("renders logo correctly", async () => {
    render(<Navbar toggleSidebar={mockToggleSidebar} />);
    expect(await screen.findByText("ALACRITY")).toBeInTheDocument();
  });

  test("renders Home and About links", async () => {
    render(<Navbar toggleSidebar={mockToggleSidebar} />);
    expect(await screen.findByText("Home")).toBeInTheDocument();
    expect(await screen.findByText("About")).toBeInTheDocument();
  });

  test("renders sidebar toggle button", async () => {
    render(<Navbar toggleSidebar={mockToggleSidebar} />);
    expect(screen.getByTestId("menu-icon")).toBeInTheDocument();
  });

  test("renders notification bell if user is logged in", async () => {
    await act(async () => {
      render(<Navbar toggleSidebar={mockToggleSidebar} />);
    });

    expect(await screen.findByTestId("bell-icon")).toBeInTheDocument();
  });
});
