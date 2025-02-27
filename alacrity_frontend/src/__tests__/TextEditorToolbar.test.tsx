import { render, screen } from "@testing-library/react";
import TextEditorToolbar from "@/components/TextEditorToolbar";
import { Editor } from "@tiptap/react";

// Mock Editor just to avoid errors since it's required in the component
jest.mock("@tiptap/react", () => ({
  Editor: jest.fn().mockImplementation(() => ({
    chain: jest.fn().mockReturnThis(),
    focus: jest.fn().mockReturnThis(),
    setImage: jest.fn().mockReturnThis(),
    toggleBold: jest.fn().mockReturnThis(),
    toggleItalic: jest.fn().mockReturnThis(),
    toggleUnderline: jest.fn().mockReturnThis(),
    toggleStrike: jest.fn().mockReturnThis(),
    toggleHeading: jest.fn().mockReturnThis(),
    toggleBulletList: jest.fn().mockReturnThis(),
    toggleOrderedList: jest.fn().mockReturnThis(),
    setTextAlign: jest.fn().mockReturnThis(),
    toggleCodeBlock: jest.fn().mockReturnThis(),
    undo: jest.fn().mockReturnThis(),
    redo: jest.fn().mockReturnThis(),
    isActive: jest.fn().mockReturnValue(false),
  })),
}));

describe("TextEditorToolbar", () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor(); // Create a mock editor instance
  });

  test("renders buttons correctly", () => {
    render(<TextEditorToolbar editor={editor} />);

    // Check if all buttons are rendered
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("I")).toBeInTheDocument();
    expect(screen.getByText("U")).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("H1")).toBeInTheDocument();
    expect(screen.getByText("Text Left")).toBeInTheDocument();
    expect(screen.getByText("Undo")).toBeInTheDocument();
    expect(screen.getByText("Image")).toBeInTheDocument();
  });
});
