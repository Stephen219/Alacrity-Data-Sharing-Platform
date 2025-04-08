
/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
"use client";

import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/config";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/libs/auth";
import { Editor } from "@tiptap/react";
import { useRef, useState } from "react";


interface ToolbarProps {
  editor: Editor | null;
}


const TextEditorToolbar = ({ editor }: ToolbarProps) => {
    const [, forceUpdate] = useState(0);
    /*eslint no-unused-vars: "error"*/
    const fileInputRef = useRef<HTMLInputElement | null>(null);

 
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    const file = files[0];

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/research/upload-image/`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.url) {
        // Insert the image into Tiptap
        editor?.chain().focus().setImage({ src: data.url }).run();
        forceUpdate((prev) => prev + 1);
      } else {
        console.error("Upload error:", data.error || data);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
    }
  };


  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-700">
      {/* Text Styles */}
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("bold")}
        className={cn(editor.isActive("bold") ? "bg-alacrityyellow" : "bg-white dark:bg-gray-700")}
        onClick={() => {
          editor.chain().focus().toggleBold().run();
          forceUpdate(prev => prev + 1);
        }}
      >
        <strong>B</strong>
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("italic")}
        className={cn(editor.isActive("italic") ? "bg-alacrityyellow" : "bg-white dark:bg-gray-700")}
        onClick={() => {
          editor.chain().focus().toggleItalic().run();
          forceUpdate(prev => prev + 1);
        }}
      >
        <em>I</em>
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("underline")}
        className={cn(editor.isActive("underline") ? "bg-alacrityyellow" : "bg-white dark:bg-gray-700")}
        onClick={() => {
          editor.chain().focus().toggleUnderline().run();
          forceUpdate(prev => prev + 1);
        }}
      >
        <u>U</u>
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("strike")}
        className={cn(editor.isActive("strike") ? "bg-alacrityyellow" : "bg-white dark:bg-gray-700")}
        onClick={() => {
          editor.chain().focus().toggleStrike().run();
          forceUpdate(prev => prev + 1);
        }}
      >
        <s>S</s>
      </Button>

      {/* Headings */}
      <Button
  variant="outline"
  size="sm"
  aria-pressed={editor.isActive("heading", { level: 1 })}
  className={cn(editor.isActive("heading", { level: 1 }) ? "bg-alacrityyellow" : "bg-white dark:bg-gray-700")}
  onClick={() => {
    editor.chain().focus().toggleHeading({ level: 1 }).run();
    if (editor.isActive("heading", { level: 1 })) {
      editor.chain().focus().setParagraph().run();
    }
    forceUpdate(prev => prev + 1);
  }}
>
  H1
</Button>

<Button
  variant="outline"
  size="sm"
  aria-pressed={editor.isActive("heading", { level: 2 })}
  className={cn(editor.isActive("heading", { level: 2 }) ? "bg-alacrityyellow" : "bg-white dark:bg-gray-700")}
  onClick={() => {
    editor.chain().focus().toggleHeading({ level: 2 }).run();
    if (editor.isActive("heading", { level: 2 })) {
      editor.chain().focus().setParagraph().run();
    }
    forceUpdate(prev => prev + 1);
  }}
>
  H2
</Button>

<Button
  variant="outline"
  size="sm"
  aria-pressed={editor.isActive("heading", { level: 3 })}
  className={cn(editor.isActive("heading", { level: 3 }) ? "bg-alacrityyellow" : "bg-white dark:bg-gray-700")}
  onClick={() => {
    editor.chain().focus().toggleHeading({ level: 3 }).run();
    if (editor.isActive("heading", { level: 3 })) {
      editor.chain().focus().setParagraph().run();
    }
    forceUpdate(prev => prev + 1);
  }}
>
  H3
</Button>

      {/* Lists */}
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("bulletList")}
        className={cn(editor.isActive("bulletList") ? "bg-alacrityyellow" : "bg-white dark:bg-gray-700")}
        onClick={() => {
          editor.chain().focus().toggleBulletList().run();
          forceUpdate(prev => prev + 1);
        }}
      >
        • List
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("orderedList")}
        className={cn(editor.isActive("orderedList") ? "bg-alacrityyellow" : "bg-white dark:bg-gray-700")}
        onClick={() => {
          editor.chain().focus().toggleOrderedList().run();
          forceUpdate(prev => prev + 1);
        }}
      >
        1. List
      </Button>

      {/* Alignment */}
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive({ textAlign: "left" })}
        className={cn(editor.isActive({ textAlign: "left" }) ? "bg-alacrityyellow" : "bg-white dark:bg-gray-700")}
        onClick={() => {
          editor.chain().focus().setTextAlign("left").run();
          forceUpdate(prev => prev + 1);
        }}
      >

        Text Left
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive({ textAlign: "center" })}
        className={cn(editor.isActive({ textAlign: "center" }) ? "bg-alacrityyellow" : "bg-white dark:bg-gray-700")}
        onClick={() => {
          editor.chain().focus().setTextAlign("center").run();
          forceUpdate(prev => prev + 1);
        }}
      >
        Text Centre
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive({ textAlign: "right" })}
        className={cn(editor.isActive({ textAlign: "right" }) ? "bg-alacrityyellow" : "bg-white dark:bg-gray-700")}
        onClick={() => {
          editor.chain().focus().setTextAlign("right").run();
          forceUpdate(prev => prev + 1);
        }}
      >
        Text Right
      </Button>

      {/* Code Block */}
      <Button
        variant="outline"
        size="sm"
        aria-pressed={editor.isActive("codeBlock")}
        className={cn(editor.isActive("codeBlock") ? "bg-alacrityyellow" : "bg-white dark:bg-gray-700")}
        onClick={() => {
          editor.chain().focus().toggleCodeBlock().run();
          forceUpdate(prev => prev + 1);
        }}
      >
        {`</>`}
      </Button>

      {/* Undo / Redo */}
      <Button variant="outline" size="sm"         onClick={() => {
          editor.chain().focus().undo().run();
          forceUpdate(prev => prev + 1);
        }}
      >
        Undo
      </Button>
      <Button variant="outline" size="sm"         onClick={() => {
          editor.chain().focus().redo().run();
          forceUpdate(prev => prev + 1);
        }}
      >
        Redo
      </Button>

        {/* Tables (Fixed Table Features) */}
    <Button 
    variant="outline" size="sm" 
    onClick={() => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run();
        forceUpdate(prev => prev + 1);
      }}
    >
        Table
      </Button>
      <Button variant="outline" size="sm" 
              onClick={() => {
                editor.chain().focus().deleteTable().run();
                forceUpdate(prev => prev + 1);
              }}
            >
        Delete Table
      </Button>
      <Button variant="outline" size="sm"         onClick={() => {
          editor.chain().focus().addColumnAfter().run();
          forceUpdate(prev => prev + 1);
        }}
      >
        Add Col After
      </Button>
      <Button variant="outline" size="sm"         onClick={() => {
          editor.chain().focus().addRowAfter().run();
          forceUpdate(prev => prev + 1);
        }}
      >
        Add Row After
      </Button>
      <Button variant="outline" size="sm"         onClick={() => {
          editor.chain().focus().addColumnBefore().run();
          forceUpdate(prev => prev + 1);
        }}
      >
        Add Col Before
      </Button>
      <Button variant="outline" size="sm"         onClick={() => {
          editor.chain().focus().addRowBefore().run();
          forceUpdate(prev => prev + 1);
        }}
      >
        Add Row Before
      </Button>
      <Button
  variant="outline"
  size="sm"
  onClick={() => editor.chain().focus().deleteRow().run()}
>
  Delete Row
</Button>

<Button
  variant="outline"
  size="sm"
  onClick={() => editor.chain().focus().deleteColumn().run()}
>
  Delete Col
</Button>


      <Button
  variant="outline"
  size="sm"
  onClick={() => {
    editor.commands.insertContentAt(editor.state.doc.content.size, "<p><br/></p>");
    editor.commands.focus(); 
  }}
>
  Break Line
</Button>

    </div>
  );
};

export default TextEditorToolbar;
