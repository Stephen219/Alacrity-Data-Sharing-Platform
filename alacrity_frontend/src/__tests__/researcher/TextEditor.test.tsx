import { render, screen } from "@testing-library/react";
import TextEditor from "@/components/TextEditor";
import { useEditor } from "@tiptap/react";

jest.mock("@tiptap/react", () => ({
  useEditor: jest.fn(),
}));

describe("TextEditor", () => {
  test("renders loading state when editor is not initialized", () => {
    (useEditor as jest.Mock).mockReturnValue(null);

    render(<TextEditor content="<p>Test content</p>" onChange={() => {}} editorInstance={null} setEditorInstance={() => {}} />);

    expect(screen.getByText("Loading editor...")).toBeInTheDocument();
  });

});
