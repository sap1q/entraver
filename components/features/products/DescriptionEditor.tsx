"use client";

import { useEffect } from "react";
import { Bold, Italic, List } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type DescriptionEditorProps = {
  value: string;
  onChange: (html: string) => void;
};

const toolbarButtonBase =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-800";

export default function DescriptionEditor({ value, onChange }: DescriptionEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] outline-none px-4 py-3 text-sm text-slate-700 prose prose-sm max-w-none [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
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

  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold text-slate-800">Deskripsi</h2>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-blue-300 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
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
        </div>

        <EditorContent editor={editor} />
      </div>
    </section>
  );
}
