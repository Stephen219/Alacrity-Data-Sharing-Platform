import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import OrganisationPage from "@/app/organisation/page";

jest.mock("@/components/LandingPage", () => {
  const MockLandingPage = () => <div data-testid="landing-page">Landing Page Content</div>;
  MockLandingPage.displayName = "LandingPage";
  return MockLandingPage;
});

jest.mock("@/components/ui/button", () => {
  const MockButton = ({ children }: { children: React.ReactNode }) => <button>{children}</button>;
  MockButton.displayName = "Button";

  return {
    Button: MockButton,
    buttonVariants: () => "mock-button-class",
  };
});

describe("Organisation Page", () => {
  beforeEach(() => {
    render(<OrganisationPage />);
  });

  test("renders the LandingPage component", () => {
    expect(screen.getByTestId("landing-page")).toBeInTheDocument();
  });

  test("renders the 'Upload Data' button", () => {
    const uploadButton = screen.getByRole("link", { name: /upload data/i });
    expect(uploadButton).toBeInTheDocument();
    expect(uploadButton).toHaveAttribute("href", "#");
  });

  test("renders the 'Approve Access' button", () => {
    const approveButton = screen.getByRole("button", { name: /approve access/i });
    expect(approveButton).toBeInTheDocument();
  });

  test("all buttons are accessible", () => {
    const buttons = screen.getAllByRole("button");
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
    });
  });
});
