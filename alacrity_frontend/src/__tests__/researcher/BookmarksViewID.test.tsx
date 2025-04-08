import React from "react";
import { render, screen } from "@testing-library/react";
import ViewBookmarkedSubmission from "@/app/researcher/bookmarks/view/[id]/page";
import { useParams } from "next/navigation";
import { BACKEND_URL } from "@/config";


jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

interface SubmissionDetailsProps {
    submissionId: string;
    fetchUrl: string;
    backUrl: string;
  }

// Mock the SubmissionDetails component to inspect its props.
jest.mock("@/components/ViewSubmission", () => ({
  __esModule: true,
  default: (props: SubmissionDetailsProps) => (
    <div data-testid="submission-details">
      <div>Submission ID: {props.submissionId}</div>
      <div>Fetch URL: {props.fetchUrl}</div>
      <div>Back URL: {props.backUrl}</div>
    </div>
  ),
}));

describe("ViewBookmarkedSubmission Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders invalid submission message when no id is provided", () => {
    // Simulate useParams returning an empty object
    (useParams as jest.Mock).mockReturnValue({});
    render(<ViewBookmarkedSubmission />);
    expect(
      screen.getByText("Invalid Submission ID")
    ).toBeInTheDocument();
  });

  test("renders SubmissionDetails component with correct props when id is provided", () => {
    const testId = "123";
    // Simulate useParams returning an id
    (useParams as jest.Mock).mockReturnValue({ id: testId });
    render(<ViewBookmarkedSubmission />);
    
    // Check that the mocked SubmissionDetails component is rendered
    const details = screen.getByTestId("submission-details");
    expect(details).toBeInTheDocument();
    // Verify that the correct props are passed
    expect(screen.getByText(`Submission ID: ${testId}`)).toBeInTheDocument();
    expect(
      screen.getByText(`Fetch URL: ${BACKEND_URL}/research/submissions/${testId}/`)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Back URL: /researcher/bookmarks")
    ).toBeInTheDocument();
  });
});
