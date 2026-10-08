/**
 * RichTextEditor.jsx — Reusable rich text editor (Tiptap v3 + shadcn/ui)
 * Adaptif Otomatis Terhadap Light Mode & Dark Mode
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder, CharacterCount } from "@tiptap/extensions";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Check,
  X,
  Heading,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── CSS INJECTION (MENDUKUNG DARK MODE) ──────────────────────────────────

const EDITOR_CSS = `
.rte-root .ProseMirror { 
  outline: none; 
  word-break: break-word; 
  white-space: pre-wrap; 
  font-size: 14px; 
  color: inherit; /* Mengikuti warna text-foreground dari container */
}
.rte-root .ProseMirror > * + * { margin-top: 0.5em; }
.rte-root .ProseMirror > *:first-child { margin-top: 0; }
.rte-root .ProseMirror p { margin: 0; line-height: 1.5; }
.rte-root .ProseMirror h1, .rte-root .ProseMirror h2, .rte-root .ProseMirror h3 { 
  font-weight: 600; line-height: 1.25; margin-top: 1em; margin-bottom: 0.25em; color: inherit;
}
.rte-root .ProseMirror h1 { font-size: 1.5rem; }
.rte-root .ProseMirror h2 { font-size: 1.2rem; }
.rte-root .ProseMirror h3 { font-size: 1.05rem; }
.rte-root .ProseMirror strong, .rte-root .ProseMirror b { font-weight: 700 !important; }
.rte-root .ProseMirror em, .rte-root .ProseMirror i  { font-style: italic !important; }
.rte-root .ProseMirror u  { text-decoration: underline !important; }
.rte-root .ProseMirror s { text-decoration: line-through !important; }
.rte-root .ProseMirror mark { background-color: #fef08a; color: #854d0e; padding: 0 2px; border-radius: 2px;}
.rte-root .ProseMirror a { color: hsl(var(--primary)); text-decoration: none !important; cursor: pointer; }
.rte-root .ProseMirror a:hover { text-decoration: underline !important; }
.rte-root .ProseMirror ul, .rte-root .ProseMirror ol { padding-left: 1.5em !important; margin: 0.25em 0 !important; }
.rte-root .ProseMirror ul  { list-style-type: disc !important; }
.rte-root .ProseMirror ol  { list-style-type: decimal !important; }
.rte-root .ProseMirror li  { display: list-item !important; margin-bottom: 0.25em;}
.rte-root .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  float: left;
  height: 0;
}
/* Warna highlight ketika menyeleksi teks */
.rte-root .ProseMirror ::selection { 
  background-color: hsl(var(--primary) / 0.2) !important; 
  color: inherit !important; 
}
`;

let _cssInjected = false;
function injectEditorCSS() {
  if (_cssInjected || typeof document === "undefined") return;
  const el = document.createElement("style");
  el.dataset.id = "rte-styles-adaptive";
  el.textContent = EDITOR_CSS;
  document.head.appendChild(el);
  _cssInjected = true;
}

function getCleanHtml(editor) {
  return editor.isEmpty ? "" : editor.getHTML();
}

// ─── TOOLBAR BUTTON ADAPTIF ──────────────────────────────────────────────

function TBtn({ active, disabled, onClick, title, children }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick?.();
      }}
      className={cn(
        "inline-flex items-center justify-center p-1.5 mx-0.5 rounded-sm transition-colors",
        "disabled:opacity-30 disabled:pointer-events-none",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function TDivider() {
  return <div className="w-px h-4 bg-border mx-1 self-center shrink-0" />;
}

// ─── URL INPUT ──────────────────────────────────────────────────────────────

function UrlBar({ onConfirm, onCancel }) {
  const [val, setVal] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const confirm = useCallback(() => {
    const trimmed = val.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      onConfirm("https://" + trimmed);
    } else {
      onConfirm(trimmed);
    }
  }, [val, onConfirm]);

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 border-t border-border bg-muted/20 rounded-b-md">
      <input
        ref={inputRef}
        type="url"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Tempel link..."
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            confirm();
          }
          if (e.key === "Escape") onCancel();
        }}
        className="flex-1 text-sm bg-background outline-none px-2 py-1 border border-border rounded focus:border-primary"
      />
      <button
        type="button"
        onClick={confirm}
        className="p-1.5 bg-primary text-primary-foreground rounded hover:opacity-90"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1.5 text-muted-foreground hover:bg-muted rounded"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── TOOLBAR UTAMA ─────────────────────────────────────────────────────────

function Toolbar({ editor, editorState }) {
  const [urlInput, setUrlInput] = useState(false);
  const I = "w-4 h-4";

  if (!editor) return null;

  const { isBold, isItalic, isStrike, isH1, isBullet, isOrdered, isLink } =
    editorState ?? {};

  const handleLink = (url) => {
    setUrlInput(false);
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-col bg-muted/40 border-b border-input rounded-t-md">
      <div className="flex flex-wrap items-center px-1.5 py-1">
        <TBtn
          active={isH1}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          title="Heading"
        >
          <Heading className={I} />
        </TBtn>
        <TDivider />
        <TBtn
          active={isBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className={I} />
        </TBtn>
        <TBtn
          active={isItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className={I} />
        </TBtn>
        <TBtn
          active={isStrike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough className={I} />
        </TBtn>
        <TDivider />
        <TBtn
          active={isBullet}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List className={I} />
        </TBtn>
        <TBtn
          active={isOrdered}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered className={I} />
        </TBtn>
        <TDivider />
        <TBtn
          active={urlInput || isLink}
          onClick={() => setUrlInput((v) => !v)}
          title="Link"
        >
          <LinkIcon className={I} />
        </TBtn>
      </div>
      {urlInput && (
        <UrlBar onConfirm={handleLink} onCancel={() => setUrlInput(false)} />
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const RichTextEditor = forwardRef(function RichTextEditor(
  {
    value,
    onChange,
    onBlur,
    placeholder = "Tulis sesuatu...",
    disabled = false,
    className,
  },
  ref,
) {
  injectEditorCSS();
  const isControlled = value !== undefined;

  const extensionsRef = useRef(null);
  if (!extensionsRef.current) {
    extensionsRef.current = [
      StarterKit.configure({ hardBreak: {} }),
      Underline,
      TableKit.configure({ resizable: false }),
      Image,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
      Placeholder.configure({ placeholder }),
    ];
  }

  const editor = useEditor({
    extensions: extensionsRef.current,
    content: isControlled ? (value ?? "") : "",
    editable: !disabled,
    onUpdate({ editor }) {
      onChange?.(getCleanHtml(editor));
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none w-full min-h-[100px] cursor-text",
      },
    },
  });

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return {};
      return {
        isBold: ctx.editor.isActive("bold"),
        isItalic: ctx.editor.isActive("italic"),
        isStrike: ctx.editor.isActive("strike"),
        isH1: ctx.editor.isActive("heading", { level: 1 }),
        isBullet: ctx.editor.isActive("bulletList"),
        isOrdered: ctx.editor.isActive("orderedList"),
        isLink: ctx.editor.isActive("link"),
      };
    },
  });

  const prevValueRef = useRef(value);
  useEffect(() => {
    if (!editor || !isControlled) return;
    if (value === prevValueRef.current) return;
    prevValueRef.current = value;
    if (getCleanHtml(editor) === value) return;

    const { from, to } = editor.state.selection;
    editor.commands.setContent(value ?? "", false);
    try {
      editor.commands.setTextSelection({ from, to });
    } catch {
      /* ignore */
    }
  }, [editor, isControlled, value]);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => editor?.commands.focus(),
      clear: () => editor?.commands.clearContent(true),
      getHTML: () => (editor ? getCleanHtml(editor) : ""),
    }),
    [editor],
  );

  const rootRef = useRef(null);

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex flex-col rounded-md border border-input bg-background shadow-sm transition-colors text-foreground",
        "focus-within:ring-1 focus-within:ring-ring focus-within:border-ring",
        className,
      )}
      onBlurCapture={(e) => {
        const next = e.relatedTarget;
        if (next && rootRef.current && rootRef.current.contains(next)) {
          return;
        }
        onBlur?.();
      }}
    >
      <Toolbar editor={editor} editorState={editorState} />
      <div
        className="rte-root px-3 py-3 flex-1 bg-transparent rounded-b-md"
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

export { RichTextEditor };
export default RichTextEditor;
