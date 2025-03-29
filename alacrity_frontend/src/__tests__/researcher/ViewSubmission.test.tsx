import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ViewSubmission from "@/app/researcher/Submissions/view/[id]/page";
import { useParams, useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

interface ViewSubmissionProps {
    submissionId: string;
    fetchUrl: string;
    backUrl: string;
    onBack: () => void;
  }

//mocks the submission component to allow inspection of props and behavior
jest.mock("@/components/ViewSubmission", () => ({
  __esModule: true,
  default: (props: ViewSubmissionProps) => (
    <div data-testid="submission-component">
      <div>Submission ID: {props.submissionId}</div>
      <div>Fetch URL: {props.fetchUrl}</div>
      <div>Back URL: {props.backUrl}</div>
      <button onClick={props.onBack}>Back</button>
    </div>
  ),
}));


describe("ViewSubmission Page", () => {
  const backMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders invalid submission message when no id is provided", () => {
    // Simulates no id returned from useParams.
    (useParams as jest.Mock).mockReturnValue({});
    (useRouter as jest.Mock).mockReturnValue({ back: backMock });

    render(<ViewSubmission />);
    
    // Expects the invalid message to be shown
    expect(
      screen.getByText("Invalid Submission ID")
    ).toBeInTheDocument();
  });

  test("renders Submission component with correct props when id is provided", () => {
    const testId = "123";
    (useParams as jest.Mock).mockReturnValue({ id: testId });
    (useRouter as jest.Mock).mockReturnValue({ back: backMock });

    render(<ViewSubmission />);
    
    // Checks that the mocked component is rendered with correct props
    expect(screen.getByTestId("submission-component")).toBeInTheDocument();
    expect(
      screen.getByText(`Submission ID: ${testId}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Fetch URL: ${BACKEND_URL}/research/submissions/${testId}/`)
    ).toBeInTheDocument();
    expect(screen.getByText("Back URL: #")).toBeInTheDocument();
  });

  test("calls router.back when onBack is triggered", () => {
    const testId = "456";
    (useParams as jest.Mock).mockReturnValue({ id: testId });
    (useRouter as jest.Mock).mockReturnValue({ back: backMock });

    render(<ViewSubmission />);
    
    // Simulates clicking the back button within the submission component.
    const backButton = screen.getByText("Back");
    fireEvent.click(backButton);
    expect(backMock).toHaveBeenCalled();
  });
});
