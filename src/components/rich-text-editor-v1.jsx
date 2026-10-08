"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Link2Off,
  Undo2,
  Redo2,
  Eraser,
  ChevronDown,
  Check,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ---------------------------------------------------------------------------
// Simple word/char counter — dihitung dari markdown string langsung, jadi
// tidak butuh extension CharacterCount terpisah (yang sering bentrok versi).
// ---------------------------------------------------------------------------
function countText(markdown) {
  const plain = (markdown ?? "").trim();
  const characters = plain.length;
  const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  return { characters, words };
}

// ---------------------------------------------------------------------------
// Block format dropdown ("Paragraph" / "Heading 1" / ... / "Numbered List")
// ---------------------------------------------------------------------------
const BLOCK_OPTIONS = [
  {
    value: "paragraph",
    label: "Paragraph",
    isActive: (e) =>
      e.isActive("paragraph") &&
      !e.isActive("bulletList") &&
      !e.isActive("orderedList"),
    run: (e) => e.chain().focus().setParagraph().run(),
  },
  {
    value: "h1",
    label: "Heading 1",
    isActive: (e) => e.isActive("heading", { level: 1 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    value: "h2",
    label: "Heading 2",
    isActive: (e) => e.isActive("heading", { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    value: "h3",
    label: "Heading 3",
    isActive: (e) => e.isActive("heading", { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    value: "quote",
    label: "Quote",
    isActive: (e) => e.isActive("blockquote"),
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    value: "bulletList",
    label: "Bulleted List",
    isActive: (e) => e.isActive("bulletList"),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    value: "orderedList",
    label: "Numbered List",
    isActive: (e) => e.isActive("orderedList"),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
];

function BlockFormatDropdown({ editor }) {
  const current =
    BLOCK_OPTIONS.find((opt) => opt.isActive(editor)) ?? BLOCK_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-[132px] justify-between px-2.5 text-xs font-normal"
        >
          <span className="truncate">{current.label}</span>
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {BLOCK_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onSelect={() => opt.run(editor)}
            className="flex items-center justify-between text-sm"
          >
            {opt.label}
            {opt.isActive(editor) && <Check className="size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Small toggle button used for marks/blocks in the toolbar
// ---------------------------------------------------------------------------
function ToolbarToggle({ pressed, onPressedChange, label, children }) {
  return (
    <Toggle
      type="button"
      size="sm"
      pressed={pressed}
      onPressedChange={onPressedChange}
      aria-label={label}
      className="size-8 p-0 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
    >
      {children}
    </Toggle>
  );
}

// ---------------------------------------------------------------------------
// Link popover: input URL, apply / remove
// ---------------------------------------------------------------------------
function LinkPopover({ editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const active = editor.isActive("link");

  const handleOpenChange = (next) => {
    if (next) setUrl(editor.getAttributes("link").href ?? "");
    setOpen(next);
  };

  const applyLink = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: trimmed, target: "_blank" })
        .run();
    }
    setOpen(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <ToolbarToggle pressed={active} label="Sisipkan tautan">
          <Link2 className="size-4" />
        </ToolbarToggle>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-2 p-3">
        <p className="text-xs font-medium text-muted-foreground">Tautan</p>
        <div className="flex gap-2">
          <Input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyLink()}
            placeholder="https://contoh.com"
            className="h-8 text-sm"
          />
          <Button type="button" size="sm" className="h-8" onClick={applyLink}>
            Terapkan
          </Button>
        </div>
        {active && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
            onClick={removeLink}
          >
            <Link2Off className="size-3.5" />
            Hapus tautan
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------
function Toolbar({ editor }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-1.5">
      <BlockFormatDropdown editor={editor} />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarToggle
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        label="Bold"
      >
        <Bold className="size-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        label="Italic"
      >
        <Italic className="size-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        label="Underline"
      >
        <UnderlineIcon className="size-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        label="Strikethrough"
      >
        <Strikethrough className="size-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("code")}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
        label="Inline code"
      >
        <Code className="size-4" />
      </ToolbarToggle>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarToggle
        pressed={editor.isActive("blockquote")}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        label="Quote"
      >
        <Quote className="size-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        label="Bulleted list"
      >
        <List className="size-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        label="Numbered list"
      >
        <ListOrdered className="size-4" />
      </ToolbarToggle>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarToggle
        pressed={editor.isActive({ textAlign: "left" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("left").run()
        }
        label="Align left"
      >
        <AlignLeft className="size-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive({ textAlign: "center" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("center").run()
        }
        label="Align center"
      >
        <AlignCenter className="size-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive({ textAlign: "right" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("right").run()
        }
        label="Align right"
      >
        <AlignRight className="size-4" />
      </ToolbarToggle>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <LinkPopover editor={editor} />

      <div className="ml-auto flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          onClick={() =>
            editor.chain().focus().clearNodes().unsetAllMarks().run()
          }
          aria-label="Clear formatting"
        >
          <Eraser className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label="Undo"
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label="Redo"
        >
          <Redo2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RichTextEditor
//
// Controlled component: `value` / `onChange` bekerja dengan string Markdown
// (bukan HTML), supaya tetap kompatibel dengan field `answer` yang sekarang
// disimpan sebagai plain text. Pakai paket resmi @tiptap/markdown (Tiptap v3).
// ---------------------------------------------------------------------------
export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Tulis jawaban di sini...",
  minHeight = 180,
  maxLength,
  disabled = false,
  className,
}) {
  // Guard supaya setContent() dari sinkronisasi eksternal (mis. form.reset)
  // tidak memicu onChange balik / merusak posisi kursor saat user mengetik.
  const isInternalUpdate = useRef(false);
  const [counts, setCounts] = useState(() => countText(value));

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      Markdown,
    ],
    content: value,
    contentType: "markdown",
    editorProps: {
      attributes: {
        class: cn(
          "prose-sm max-w-none px-3 py-2.5 text-sm leading-6 focus:outline-none",
          "[&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-lg [&_h1]:font-semibold",
          "[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold",
          "[&_h3]:mb-1.5 [&_h3]:mt-2.5 [&_h3]:text-sm [&_h3]:font-semibold",
          "[&_p]:mb-2 [&_p]:last:mb-0",
          "[&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5",
          "[&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_li]:mb-0.5",
          "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
          "[&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
        ),
      },
    },
    onUpdate: ({ editor: e }) => {
      isInternalUpdate.current = true;
      const markdown = e.getMarkdown();
      setCounts(countText(markdown));
      onChange?.(markdown);
    },
  });

  // Sinkronisasi saat `value` berubah dari luar (mis. form.reset saat mode
  // edit selesai fetch data), tapi hindari loop dari perubahan milik sendiri.
  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const current = editor.getMarkdown();
    if (value !== current) {
      editor.commands.setContent(value ?? "", {
        contentType: "markdown",
        emitUpdate: false,
      });
      setCounts(countText(value));
    }
  }, [value, editor]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border bg-background shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring",
        disabled && "opacity-60",
        className,
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="cursor-text"
        onClick={() => editor?.chain().focus().run()}
      />
      <div className="flex items-center justify-end gap-1 border-t bg-muted/30 px-3 py-1 text-[11px] text-muted-foreground">
        {maxLength
          ? `${counts.characters}/${maxLength} karakter`
          : `${counts.characters} karakter`}
        <span className="opacity-50">•</span>
        {counts.words} kata
      </div>
    </div>
  );
}
