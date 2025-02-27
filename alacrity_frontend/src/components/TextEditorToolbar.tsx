"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRef } from "react";

interface ToolbarProps {
  editor: any;
}

const TextEditorToolbar = ({ editor }: ToolbarProps) => {
  if (!editor) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        editor.chain().focus().setImage({ src: reader.result as string }).run();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Text Styles */}
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("bold")}
        className={cn(editor.isActive("bold") && "bg-gray-300")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("italic")}
        className={cn(editor.isActive("italic") && "bg-gray-300")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("underline")}
        className={cn(editor.isActive("underline") && "bg-gray-300")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <u>U</u>
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("strike")}
        className={cn(editor.isActive("strike") && "bg-gray-300")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </Button>

      {/* Headings */}
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("heading", { level: 1 })}
        className={cn(editor.isActive("heading", { level: 1 }) && "bg-gray-300")}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("heading", { level: 2 })}
        className={cn(editor.isActive("heading", { level: 2 }) && "bg-gray-300")}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("heading", { level: 3 })}
        className={cn(editor.isActive("heading", { level: 3 }) && "bg-gray-300")}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </Button>

      {/* Lists */}
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("bulletList")}
        className={cn(editor.isActive("bulletList") && "bg-gray-300")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("orderedList")}
        className={cn(editor.isActive("orderedList") && "bg-gray-300")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </Button>

      {/* Alignment */}
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive({ textAlign: "left" })}
        className={cn(editor.isActive({ textAlign: "left" }) && "bg-gray-300")}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        Text Left
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive({ textAlign: "center" })}
        className={cn(editor.isActive({ textAlign: "center" }) && "bg-gray-300")}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        Text Centre
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive({ textAlign: "right" })}
        className={cn(editor.isActive({ textAlign: "right" }) && "bg-gray-300")}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        Text Right
      </Button>

      {/* Code Block */}
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("codeBlock")}
        className={cn(editor.isActive("codeBlock") && "bg-gray-300")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        {`</>`}
      </Button>

      {/* Undo / Redo */}
      <Button variant="outline" size="sm" onClick={() => editor.chain().focus().undo().run()}>
        Undo
      </Button>
      <Button variant="outline" size="sm" onClick={() => editor.chain().focus().redo().run()}>
        Redo
      </Button>

      {/* Images */}
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
        Image
      </Button>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
};

export default TextEditorToolbar;
