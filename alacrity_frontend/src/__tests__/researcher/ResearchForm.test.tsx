import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ResearchForm from "@/components/ResearchForm";
import { Editor } from "@tiptap/react";
import { fetchWithAuth } from "@/libs/auth";
import "@testing-library/jest-dom";
import { ReactNode } from "react";

jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(async (url) => {
    if (url.includes("/research/submissions/save/")) {
      return { ok: true, json: async () => ({ id: 1 }) }; 
    }
    return { ok: false, json: async () => ({ error: "Unknown API Call" }) };
  }),
}));

jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({ id: "123" })),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ onClick, children, disabled }: { onClick?: () => void; children: ReactNode; disabled?: boolean }) => (
    <button data-testid={children?.toString()} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/TextEditor", () => ({
  __esModule: true,
  default: ({ content, onChange, placeholder }: { content: string; onChange: (value: string) => void; placeholder: string }) => (
    <textarea
      data-testid={`editor-${placeholder}`}
      value={content}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const createMockEditor = () => ({
  isActive: jest.fn(() => false),
  chain: jest.fn(() => ({
    focus: jest.fn(() => ({
      toggleBold: jest.fn(() => ({ run: jest.fn() })),
      toggleItalic: jest.fn(() => ({ run: jest.fn() })),
      setParagraph: jest.fn(() => ({ run: jest.fn() })),
      undo: jest.fn(() => ({ run: jest.fn() })),
      redo: jest.fn(() => ({ run: jest.fn() })),
    })),
  })),
  commands: { insertContentAt: jest.fn(), focus: jest.fn() },
  state: { doc: { content: { size: 10 } } },
  getJSON: jest.fn(() => ({ type: "doc", content: [] })),
} as unknown as Editor);

describe("ResearchForm", () => {
  let mockEditor: Editor;

  beforeEach(() => {
    mockEditor = createMockEditor();
    jest.clearAllMocks();
  });

  test("renders form fields correctly", () => {
    render(<ResearchForm editorInstance={mockEditor} setEditorInstance={() => {}} />);

    expect(screen.getByTestId("editor-Enter title...")).toBeInTheDocument();
    expect(screen.getByTestId("editor-Describe your analysis process...")).toBeInTheDocument();
    expect(screen.getByTestId("editor-Enter raw results...")).toBeInTheDocument();
    expect(screen.getByTestId("editor-Summarize your findings...")).toBeInTheDocument();
  });

  test("updates form data when text editors change", async () => {
    render(<ResearchForm editorInstance={mockEditor} setEditorInstance={() => {}} />);
    const titleInput = screen.getByTestId("editor-Enter title...");

    fireEvent.change(titleInput, { target: { value: "New Title" } });

    await waitFor(() => {
      expect(titleInput).toHaveValue("New Title");
    });
  });

  test("saves as draft successfully", async () => {
    render(<ResearchForm editorInstance={mockEditor} setEditorInstance={() => {}} />);
    const saveButton = screen.getByTestId("Save as Draft");

    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Draft Saved Successfully!"))
        .toBeInTheDocument();
    });
  });

  test("shows error message if save fails", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Something went wrong" }),
    });

    render(<ResearchForm editorInstance={mockEditor} setEditorInstance={() => {}} />);
    const saveButton = screen.getByTestId("Save as Draft");

    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Error: Something went wrong"))
        .toBeInTheDocument();
    });
  });

  test("submits and publishes successfully", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1 }),
    });

    render(<ResearchForm editorInstance={mockEditor} setEditorInstance={() => {}} />);
    const submitButton = screen.getByTestId("Submit");

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Research Submitted for Approval!"))
        .toBeInTheDocument();
    });
  });

  test("shows error message if submit fails", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Failed to publish" }),
    });

    render(<ResearchForm editorInstance={mockEditor} setEditorInstance={() => {}} />);
    const submitButton = screen.getByTestId("Submit");

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Error: Failed to publish"))
        .toBeInTheDocument();
    });
  });
});