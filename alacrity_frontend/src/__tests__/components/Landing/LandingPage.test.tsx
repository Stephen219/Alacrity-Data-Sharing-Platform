import { render, screen, fireEvent } from "@testing-library/react";
import LandingPage from "@/components/Landing/LandingPage";
import { useRouter } from "next/navigation";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("LandingPage Component", () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    // Set the mock router to return our push function
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    pushMock.mockClear();
  });

  test("renders all content correctly", () => {
    render(<LandingPage />);

    // Check the main heading and that it contains the expected text
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/Your favourite platform for secure/i);

    // Check that the <span> for "data collaboration" has the correct class
    const span = screen.getByText("data collaboration");
    expect(span).toHaveClass("text-orange-600");

    // Check for the descriptive paragraph
    expect(screen.getByText(/Welcome to Alacrity. The fastest way/i)).toBeInTheDocument();

    // Check that the "About Us" Link exists with the correct href
    const aboutLink = screen.getByRole("link", { name: /About Us/i });
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink).toHaveAttribute("href", "/about");

    // Check that the "Explore Research →" Button is rendered
    const exploreButton = screen.getByRole("button", { name: /Explore Research/i });
    expect(exploreButton).toBeInTheDocument();

    // Check that the landing image is rendered with the correct alt text
    const image = screen.getByAltText(/Landing page image/i);
    expect(image).toBeInTheDocument();
  });

  test('navigates to "/researcher/allSubmissions" when the Explore Research button is clicked', () => {
    render(<LandingPage />);
    const exploreButton = screen.getByRole("button", { name: /Explore Research/i });
    fireEvent.click(exploreButton);
    expect(pushMock).toHaveBeenCalledWith("/feed");
  });
});
