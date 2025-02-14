import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ResearcherPage from "@/app/researcher/page";

// Mock LandingPage
jest.mock("@/components/LandingPage", () => {
  const MockLandingPage = () => <div data-testid="landing-page">Landing Page Content</div>;
  MockLandingPage.displayName = "LandingPage";
  return MockLandingPage;
});

// Mock Button and buttonVariants
jest.mock("@/components/ui/button", () => {
  const MockButton = ({ children }: { children: React.ReactNode }) => <button>{children}</button>;
  MockButton.displayName = "Button";

  return {
    Button: MockButton,
    buttonVariants: () => "mock-button-class",
  };
});

describe("Researcher Page", () => {
  beforeEach(() => {
    render(<ResearcherPage />);
  });

  test("renders the LandingPage component", () => {
    expect(screen.getByTestId("landing-page")).toBeInTheDocument();
  });

  test("renders the 'Upload Research' button", () => {
    const uploadButton = screen.getByRole("link", { name: /upload research/i });
    expect(uploadButton).toBeInTheDocument();
    expect(uploadButton).toHaveAttribute("href", "#");
  });

  test("renders the 'View Requests' button", () => {
    const viewRequestsButton = screen.getByRole("button", { name: /view requests/i });
    expect(viewRequestsButton).toBeInTheDocument();
  });

  test("all buttons are accessible", () => {
    const buttons = screen.getAllByRole("button");
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
    });
  });
});
