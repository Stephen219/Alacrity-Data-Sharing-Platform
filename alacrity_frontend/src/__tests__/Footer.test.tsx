import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "@/components/Footer";

describe("Footer Component", () => {
  beforeEach(() => {
    render(<Footer />);
  });

  test("renders the footer", () => {
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  test("displays the copyright text", () => {
    expect(
      screen.getByText((content, element) =>
        element?.tagName === "SPAN" && content.includes("© 2025") && content.includes("All Rights Reserved.")
      )
    ).toBeInTheDocument();
  });  

  test("renders Privacy Policy link", () => {
    expect(screen.getByRole("link", { name: /privacy policy/i })).toBeInTheDocument();
  });

  test("renders Terms Of Use link", () => {
    expect(screen.getByRole("link", { name: /terms of use/i })).toBeInTheDocument();
  });

  test("renders Contact link", () => {
    expect(screen.getByRole("link", { name: /contact/i })).toBeInTheDocument();
  });

  test("renders Social Media link", () => {
    expect(screen.getByRole("link", { name: /social media/i })).toBeInTheDocument();
  });

  test("all links are accessible", () => {
    const links = screen.getAllByRole("link");
    links.forEach(link => {
      expect(link).toHaveAttribute("href");
    });
  });
});
