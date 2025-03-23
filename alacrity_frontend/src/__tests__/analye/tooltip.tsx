import { render, screen, fireEvent } from "@testing-library/react";
import TourTooltip, { Placement } from "@/components/analyze/tooltip";


// Mock createPortal to render content directly for testing
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (children: unknown) => children, 
}));

// Mock window methods
beforeAll(() => {
  window.scrollY = 0;
  window.innerWidth = 1024;
  window.innerHeight = 768;
  window.addEventListener = jest.fn();
  window.removeEventListener = jest.fn();
});

describe("TourTooltip", () => {
  const defaultProps = {
    target: "#test-element",
    content: "This is a tooltip",
    placement: "bottom" as Placement,
    currentStep: 1,
    totalSteps: 3,
    onNext: jest.fn(),
    onPrev: jest.fn(),
    onSkip: jest.fn(),
  };

  beforeEach(() => {
    // Mock querySelector to return a fake target element
    document.querySelector = jest.fn((selector) => {
      if (selector === "#test-element") {
        return {
          getBoundingClientRect: () => ({
            top: 100,
            left: 200,
            bottom: 150,
            right: 250,
            width: 50,
            height: 50,
          }),
          style: {
            position: "",
            zIndex: "",
            boxShadow: "",
            borderRadius: "",
          },
        };
      }
      return null;
    });

    // Mock getBoundingClientRect for the tooltip itself
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
        width: 256, // Matches w-64 (64 * 4px = 256px assuming 1rem = 16px)
        height: 100,
        x: 0,
        y: 0,
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        toJSON: function () {
            throw new Error("Function not implemented.");
        }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders tooltip with content and navigation", () => {
    render(<TourTooltip {...defaultProps} />);

    // Check content
    expect(screen.getByText("This is a tooltip")).toBeInTheDocument();

    // Check step progress
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();

    // Check navigation buttons
    expect(screen.getByLabelText("Next step")).toBeInTheDocument();
    expect(screen.queryByLabelText("Previous step")).not.toBeInTheDocument(); // Step 1, no prev
    expect(screen.getByLabelText("Close tour")).toBeInTheDocument();
  });

  


  test("calls onNext when next button is clicked", () => {
    render(<TourTooltip {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("Next step"));
    expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
  });

  test("calls onPrev when prev button is clicked on step 2", () => {
    render(<TourTooltip {...defaultProps} currentStep={2} />);

    fireEvent.click(screen.getByLabelText("Previous step"));
    expect(defaultProps.onPrev).toHaveBeenCalledTimes(1);
  });

  test("calls onSkip when close button is clicked", () => {
    render(<TourTooltip {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("Close tour"));
    expect(defaultProps.onSkip).toHaveBeenCalledTimes(1);
  });

  test("shows Finish button on last step and calls onSkip", () => {
    render(<TourTooltip {...defaultProps} currentStep={3} totalSteps={3} />);

    const finishButton = screen.getByText("Finish");
    expect(finishButton).toBeInTheDocument();
    expect(screen.queryByLabelText("Next step")).not.toBeInTheDocument();

    fireEvent.click(finishButton);
    expect(defaultProps.onSkip).toHaveBeenCalledTimes(1);
  });


});