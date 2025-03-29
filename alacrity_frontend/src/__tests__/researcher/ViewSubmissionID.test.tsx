import React from "react";
import { render, screen } from "@testing-library/react";
import ViewPublicSubmission from "@/app/researcher/allSubmissions/view/[id]/page";
import { useParams } from "next/navigation";
import { BACKEND_URL } from "@/config";


jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

interface ViewSubmissionProps {
    submissionId: string;
    fetchUrl: string;
    backUrl: string;
  }

jest.mock("@/components/ViewSubmission", () => ({
  __esModule: true,
  default: (props: ViewSubmissionProps) => (
    <div data-testid="submission-details">
      <div>Submission ID: {props.submissionId}</div>
      <div>Fetch URL: {props.fetchUrl}</div>
      <div>Back URL: {props.backUrl}</div>
    </div>
  ),
}));

describe("ViewPublicSubmission Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders invalid submission message when no id is provided", () => {
    // Simulate no id returned from useParams
    (useParams as jest.Mock).mockReturnValue({});

    render(<ViewPublicSubmission />);
    expect(
      screen.getByText("Invalid Submission ID")
    ).toBeInTheDocument();
  });

  test("renders SubmissionDetails component with correct props when id is provided", () => {
    const testId = "123";
    (useParams as jest.Mock).mockReturnValue({ id: testId });

    render(<ViewPublicSubmission />);
    
    // Check that the mocked submission details component is rendered.
    const details = screen.getByTestId("submission-details");
    expect(details).toBeInTheDocument();
    // Verify that the correct props are passed
    expect(screen.getByText(`Submission ID: ${testId}`)).toBeInTheDocument();
    expect(
      screen.getByText(`Fetch URL: ${BACKEND_URL}/research/submissions/${testId}/`)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Back URL: /researcher/allSubmissions")
    ).toBeInTheDocument();
  });
});
