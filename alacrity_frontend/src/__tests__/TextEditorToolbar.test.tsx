import { render, screen, fireEvent, act } from "@testing-library/react";
import TextEditorToolbar from "@/components/TextEditorToolbar";
import "@testing-library/jest-dom";
import { Editor } from "@tiptap/react";
import { ReactNode } from "react";

jest.mock("@/components/ui/button", () => ({
  Button: ({
    onClick,
    children,
    "aria-pressed": isActive,
  }: {
    onClick?: () => void;
    children: ReactNode;
    "aria-pressed"?: boolean;
  }) => (
    <button data-testid={children?.toString()} onClick={onClick} aria-pressed={isActive}>
      {children}
    </button>
  ),
}));


const createMockEditor = () =>
  ({
    isActive: jest.fn(() => false), 
    chain: jest.fn().mockReturnValue({
      focus: jest.fn().mockReturnValue({
        toggleBold: jest.fn().mockReturnValue({ run: jest.fn() }),
        toggleItalic: jest.fn().mockReturnValue({ run: jest.fn() }),
        toggleUnderline: jest.fn().mockReturnValue({ run: jest.fn() }),
        toggleStrike: jest.fn().mockReturnValue({ run: jest.fn() }),
        toggleHeading: jest.fn().mockReturnValue({ run: jest.fn() }),
        setParagraph: jest.fn().mockReturnValue({ run: jest.fn() }),
        toggleBulletList: jest.fn().mockReturnValue({ run: jest.fn() }),
        toggleOrderedList: jest.fn().mockReturnValue({ run: jest.fn() }),
        setTextAlign: jest.fn().mockReturnValue({ run: jest.fn() }),
        toggleCodeBlock: jest.fn().mockReturnValue({ run: jest.fn() }),
        undo: jest.fn().mockReturnValue({ run: jest.fn() }),
        redo: jest.fn().mockReturnValue({ run: jest.fn() }),
        insertTable: jest.fn().mockReturnValue({ run: jest.fn() }),
        deleteTable: jest.fn().mockReturnValue({ run: jest.fn() }),
        addColumnAfter: jest.fn().mockReturnValue({ run: jest.fn() }),
        addColumnBefore: jest.fn().mockReturnValue({ run: jest.fn() }),
        addRowAfter: jest.fn().mockReturnValue({ run: jest.fn() }),
        addRowBefore: jest.fn().mockReturnValue({ run: jest.fn() }),
        deleteRow: jest.fn().mockReturnValue({ run: jest.fn() }),
        deleteColumn: jest.fn().mockReturnValue({ run: jest.fn() }),
        insertContentAt: jest.fn().mockReturnValue({ run: jest.fn() }),
      }),
    }),
    commands: {
      focus: jest.fn(),
      insertContentAt: jest.fn(),
    },
    state: {
      doc: {
        content: { size: 10 },
      },
    },
  } as unknown as Editor);

describe("TextEditorToolbar Component", () => {
  let mockEditor: Editor;

  beforeEach(() => {
    mockEditor = createMockEditor();
  });


  test("does not render when editor is null", () => {
    const { container } = render(<TextEditorToolbar editor={null} />);
    expect(container.firstChild).toBeNull();
  });


  test("clicking H1 button toggles heading level 1", async () => {
    render(<TextEditorToolbar editor={mockEditor} />);
    const h1Button = screen.getByTestId("H1");

    await act(async () => {
      fireEvent.click(h1Button);
    });

    expect(mockEditor.chain().focus().toggleHeading({ level: 1 }).run).toHaveBeenCalled();
  });

  test("clicking bullet list button toggles bullet list", async () => {
    render(<TextEditorToolbar editor={mockEditor} />);
    const bulletListButton = screen.getByTestId("• List");

    await act(async () => {
      fireEvent.click(bulletListButton);
    });

    expect(mockEditor.chain().focus().toggleBulletList().run).toHaveBeenCalled();
  });

  test("clicking undo button calls editor undo", async () => {
    render(<TextEditorToolbar editor={mockEditor} />);
    const undoButton = screen.getByTestId("Undo");

    await act(async () => {
      fireEvent.click(undoButton);
    });

    expect(mockEditor.chain().focus().undo().run).toHaveBeenCalled();
  });

  test("clicking redo button calls editor redo", async () => {
    render(<TextEditorToolbar editor={mockEditor} />);
    const redoButton = screen.getByTestId("Redo");

    await act(async () => {
      fireEvent.click(redoButton);
    });

    expect(mockEditor.chain().focus().redo().run).toHaveBeenCalled();
  });

  test("clicking insert table button calls editor insertTable", async () => {
    render(<TextEditorToolbar editor={mockEditor} />);
    const tableButton = screen.getByTestId("Table");

    await act(async () => {
      fireEvent.click(tableButton);
    });

    expect(mockEditor.chain().focus().insertTable({ rows: 3, cols: 3 }).run).toHaveBeenCalled();
  });

  test("clicking delete table button calls editor deleteTable", async () => {
    render(<TextEditorToolbar editor={mockEditor} />);
    const deleteTableButton = screen.getByTestId("Delete Table");

    await act(async () => {
      fireEvent.click(deleteTableButton);
    });

    expect(mockEditor.chain().focus().deleteTable().run).toHaveBeenCalled();
  });

  test("clicking add row before button calls editor addRowBefore", async () => {
    render(<TextEditorToolbar editor={mockEditor} />);
    const addRowBeforeButton = screen.getByTestId("Add Row Before");

    await act(async () => {
      fireEvent.click(addRowBeforeButton);
    });

    expect(mockEditor.chain().focus().addRowBefore().run).toHaveBeenCalled();
  });

  test("clicking exit table button calls editor insertContentAt", async () => {
    render(<TextEditorToolbar editor={mockEditor} />);
    const exitTableButton = screen.getByTestId("Exit Table");

    await act(async () => {
      fireEvent.click(exitTableButton);
    });

    expect(mockEditor.commands.insertContentAt).toHaveBeenCalledWith(10, "<p><br/></p>");
  });
});
