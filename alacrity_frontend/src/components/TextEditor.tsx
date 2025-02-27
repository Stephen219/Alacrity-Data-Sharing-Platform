"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Underline from "@tiptap/extension-underline";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Blockquote from "@tiptap/extension-blockquote";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import CodeBlock from "@tiptap/extension-code-block";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { useEffect } from "react";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  editorInstance: any;
  setEditorInstance: (editor: any) => void;
  autoFocus?: boolean;
  placeholder?: string;
  small?: boolean;
}

const TextEditor = ({ content, onChange, editorInstance, setEditorInstance, autoFocus = false, placeholder, small = false }: EditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({ levels: [1, 2, 3] }),
      Bold,
      Italic,
      Strike,
      Underline,
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
      CodeBlock,
      HorizontalRule,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      if (newContent !== content) {
        onChange(newContent);
      }
    },
    onFocus: ({ editor }) => {
      if (editorInstance !== editor) {
        setEditorInstance(editor);
      }
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false); 
    }
  }, [content, editor]);

  useEffect(() => {
    if (autoFocus && editor) {
      editor.commands.focus();
    }
  }, [editor, autoFocus]);

  if (!editor) {
    return <div className="p-4 border rounded bg-gray-100">Loading editor...</div>;
  }

  return (
    <div className="prose relative border border-gray-300 rounded-lg bg-white shadow-sm p-2">
      <EditorContent editor={editor} className="p-2 text-sm bg-transparent focus:outline-none" />
    </div>
  );
};

export default TextEditor;