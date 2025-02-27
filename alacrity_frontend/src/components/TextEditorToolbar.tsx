"use client";

import { Button } from "@/components/ui/button";

interface ToolbarProps {
  editor: any;
}

const TextEditorToolbar = ({ editor }: ToolbarProps) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-2 bg-gray-100 p-2 border border-gray-300 rounded-lg mb-4">
      {/* Basic Formatting */}
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>B</strong>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <u>U</u>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleStrike().run()}>
        <s>S</s>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHighlight().run()}>
        <span className="bg-yellow-200 px-1">H</span>
      </Button>

      {/* Headings (✅ Fixed Headers) */}
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </Button>
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </Button>
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </Button>

      {/* Lists (✅ Fixed Bullet & Ordered Lists) */}
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • List
      </Button>
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. List
      </Button>

      {/* Blockquote (✅ Fixed Quotations) */}
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        “
      </Button>

      {/* Code Block */}
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        {`</>`}
      </Button>

      {/* Tables (✅ Fixed Table Features) */}
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}>
        Table
      </Button>
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().deleteTable().run()}>
        Delete Table
      </Button>
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().addColumnBefore().run()}>
        Add Col
      </Button>
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().addRowBefore().run()}>
        Add Row
      </Button>

      {/* Text Alignment */}
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        Left
      </Button>
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        Middle
      </Button>
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        Right
      </Button>

      {/* Horizontal Rule */}
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        Line
      </Button>

      {/* Undo / Redo */}
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()}>
        Undo
      </Button>
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()}>
        Redo
      </Button>
    </div>
  );
};

export default TextEditorToolbar;
