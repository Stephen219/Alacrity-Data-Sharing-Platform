import { render, screen } from "@testing-library/react";
import AnalysisForm from "@/app/researcher/publicationForm/page"; 
import "@testing-library/jest-dom";
import { Editor } from "@tiptap/react";

jest.mock("@/components/MaxWidthWrapper", () => {
    const MockMaxWidthWrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
    MockMaxWidthWrapper.displayName = "MockMaxWidthWrapper";
    return MockMaxWidthWrapper;
  });

jest.mock("@/components/ResearchForm", () => {
  const MockResearchForm = ({ editorInstance }: { editorInstance: Editor | null }) => (
    <div data-testid="research-form">{editorInstance ? "Editor Initialized" : "No Editor"}</div>
  );
  MockResearchForm.displayName = "MockResearchForm";
  return MockResearchForm;
});


describe("AnalysisForm Component", () => {
  test("renders the header correctly", () => {
    render(<AnalysisForm />);
    expect(screen.getByRole("heading", { level: 2, name: "Submit Analysis" })).toBeInTheDocument();
  });


  test("renders ResearchForm with the correct props", () => {
    render(<AnalysisForm />);
    expect(screen.getByTestId("research-form")).toHaveTextContent("No Editor");
  });
});
