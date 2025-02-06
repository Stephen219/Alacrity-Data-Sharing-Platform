import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import NavItem from "@/components/NavItem";
import "@testing-library/jest-dom";

jest.mock("lucide-react", () => ({
  ChevronDown: () => (
    <svg data-testid="chevron-down" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M19 9l-7 7-7-7" />
    </svg>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} data-testid="mock-image" />
  ),
}));

const mockTools = {
  label: "Test Tools",
  value: "test",
  roles: ["researcher"],
  featured: [
    {
      name: "Featured Item 1",
      href: "/item1",
      imageSrc: "/test-image-1.jpg",
    },
    {
      name: "Featured Item 2",
      href: "/item2",
      imageSrc: "/test-image-2.jpg",
    },
  ],
};

describe("NavItem Component", () => {
  test("renders the navigation button with correct label", () => {
    render(<NavItem tools={mockTools} handleOpen={() => {}} isOpen={false} isAnyOpen={false} />);

    const button = screen.getByRole("button", { name: /test tools/i });
    expect(button).toBeInTheDocument();
  });

  test("renders the ChevronDown icon", () => {
    render(<NavItem tools={mockTools} handleOpen={() => {}} isOpen={false} isAnyOpen={false} />);

    const chevronIcon = screen.getByTestId("chevron-down");
    expect(chevronIcon).toBeInTheDocument();
  });

  test("calls handleOpen when button is clicked", () => {
    const mockHandleOpen = jest.fn();
    render(<NavItem tools={mockTools} handleOpen={mockHandleOpen} isOpen={false} isAnyOpen={false} />);

    const button = screen.getByRole("button", { name: /test tools/i });
    fireEvent.click(button);

    expect(mockHandleOpen).toHaveBeenCalledTimes(1);
  });

  test("renders featured items when dropdown is open", () => {
    render(<NavItem tools={mockTools} handleOpen={() => {}} isOpen={true} isAnyOpen={false} />);

    expect(screen.getByText("Featured Item 1")).toBeInTheDocument();
    expect(screen.getByText("Featured Item 2")).toBeInTheDocument();
  });

  test("renders correct image sources for featured items", () => {
    render(<NavItem tools={mockTools} handleOpen={() => {}} isOpen={true} isAnyOpen={false} />);

    const images = screen.getAllByTestId("mock-image");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "/test-image-1.jpg");
    expect(images[1]).toHaveAttribute("src", "/test-image-2.jpg");
  });

  test("dropdown is hidden when `isOpen` is false", () => {
    render(<NavItem tools={mockTools} handleOpen={() => {}} isOpen={false} isAnyOpen={false} />);

    expect(screen.queryByText("Featured Item 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Featured Item 2")).not.toBeInTheDocument();
  });
});
