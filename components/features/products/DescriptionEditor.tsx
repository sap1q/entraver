"use client";

import { useEffect } from "react";
import {
  Bold,
  Eraser,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Sparkles,
  Undo2,
} from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { normalizeDescriptionHtml } from "@/lib/description";

type DescriptionEditorProps = {
  value: string;
  onChange: (html: string) => void;
};

const toolbarButtonBase =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-800";
const toolbarWideButtonBase =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800";

export default function DescriptionEditor({ value, onChange }: DescriptionEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] outline-none px-4 py-3 text-sm text-slate-700 prose prose-sm max-w-none [&_h2]:my-2 [&_h2]:text-base [&_h2]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-3 [&_blockquote]:italic",
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === value) return;
    editor.commands.setContent(value || "<p></p>", false);
  }, [editor, value]);

  const handleTidy = () => {
    if (!editor) return;
    const normalized = normalizeDescriptionHtml(editor.getHTML());
    editor.commands.setContent(normalized, false);
    onChange(normalized);
  };

  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold text-slate-800">Deskripsi</h2>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-blue-300 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`${toolbarButtonBase} ${editor?.isActive("bold") ? "border-blue-300 text-blue-600" : ""}`}
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`${toolbarButtonBase} ${editor?.isActive("italic") ? "border-blue-300 text-blue-600" : ""}`}
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`${toolbarButtonBase} ${editor?.isActive("bulletList") ? "border-blue-300 text-blue-600" : ""}`}
            aria-label="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`${toolbarButtonBase} ${editor?.isActive("orderedList") ? "border-blue-300 text-blue-600" : ""}`}
            aria-label="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().setParagraph().run()}
            className={`${toolbarButtonBase} ${editor?.isActive("paragraph") ? "border-blue-300 text-blue-600" : ""}`}
            aria-label="Paragraph"
          >
            <Pilcrow className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`${toolbarButtonBase} ${editor?.isActive("heading", { level: 2 }) ? "border-blue-300 text-blue-600" : ""}`}
            aria-label="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={`${toolbarButtonBase} ${editor?.isActive("blockquote") ? "border-blue-300 text-blue-600" : ""}`}
            aria-label="Quote"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
            className={toolbarButtonBase}
            aria-label="Clear Format"
          >
            <Eraser className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().undo().run()}
            className={toolbarButtonBase}
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().redo().run()}
            className={toolbarButtonBase}
            aria-label="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleTidy}
            className={toolbarWideButtonBase}
            aria-label="Rapikan deskripsi"
          >
            <Sparkles className="h-4 w-4" />
            Rapikan
          </button>
        </div>

        <EditorContent editor={editor} />
      </div>
      <p className="text-xs text-slate-500">
        Gunakan toolbar untuk format paragraf, lalu klik <span className="font-semibold">Rapikan</span> agar struktur deskripsi lebih rapi.
      </p>
    </section>
  );
}
