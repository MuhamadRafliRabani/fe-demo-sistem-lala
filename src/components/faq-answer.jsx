"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "isomorphic-dompurify";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// FaqAnswer — render jawaban FAQ yang disimpan sebagai Markdown (normal) ATAU
// HTML mentah (fallback dari serializer Tiptap untuk struktur list tertentu).
// Dipakai di mana pun jawaban FAQ ditampilkan lengkap (view modal, detail
// panel lead, dll) supaya formatnya konsisten.
// ---------------------------------------------------------------------------
const HTML_TAG_RE = /<\/?[a-z][\s\S]*>/i;
export const isHtmlContent = (text) => HTML_TAG_RE.test(text ?? "");

const WRAP = "break-words [overflow-wrap:anywhere]";

const md = {
  p: ({ node, ...props }) => <p className={cn("my-2", WRAP)} {...props} />,
  ul: ({ node, ...props }) => (
    <ul
      className="my-2 list-disc space-y-1 pl-5 marker:text-muted-foreground/60"
      {...props}
    />
  ),
  ol: ({ node, ...props }) => (
    <ol
      className="my-2 list-decimal space-y-1 pl-5 marker:text-muted-foreground/60"
      {...props}
    />
  ),
  li: ({ node, ...props }) => <li className={WRAP} {...props} />,
  strong: ({ node, ...props }) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  em: ({ node, ...props }) => <em className="italic" {...props} />,
  a: ({ node, ...props }) => (
    <a
      className="break-all text-primary underline underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  h1: ({ node, ...props }) => (
    <h1
      className="mb-2 mt-4 text-base font-semibold text-foreground"
      {...props}
    />
  ),
  h2: ({ node, ...props }) => (
    <h2
      className="mb-2 mt-4 text-base font-semibold text-foreground"
      {...props}
    />
  ),
  h3: ({ node, ...props }) => (
    <h3
      className="mb-1.5 mt-3 text-sm font-semibold text-foreground"
      {...props}
    />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="my-2 border-l-2 pl-3 italic text-muted-foreground/80"
      {...props}
    />
  ),
  code: ({ node, inline, ...props }) =>
    inline ? (
      <code
        className="break-all rounded bg-muted px-1 py-0.5 text-xs"
        {...props}
      />
    ) : (
      <code
        className="block break-words rounded bg-muted p-2 text-xs"
        {...props}
      />
    ),
  hr: ({ node, ...props }) => <hr className="my-3 border-border" {...props} />,
};

const RICH_HTML_CLASS = cn(
  "text-sm leading-6 text-muted-foreground",
  WRAP,
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
  "[&_p]:my-2",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
  "[&_li]:pl-1 [&_li]:marker:text-muted-foreground/60",
  "[&_li>p]:my-0 [&_li>ul]:my-1 [&_li>ol]:my-1",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_em]:italic",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:break-all",
  "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-foreground",
  "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground",
  "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground/80",
  "[&_hr]:my-3 [&_hr]:border-border",
  "[&_code]:break-all [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs",
);

export function stripToPlainText(text) {
  if (isHtmlContent(text)) {
    return DOMPurify.sanitize(text ?? "", { ALLOWED_TAGS: [] }).trim();
  }
  return (text ?? "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();
}

export function FaqAnswer({ text, className }) {
  if (!text) {
    return (
      <p className="text-sm italic text-muted-foreground">Belum ada jawaban.</p>
    );
  }

  if (isHtmlContent(text)) {
    const clean = DOMPurify.sanitize(text);
    return (
      <div
        className={cn(RICH_HTML_CLASS, className)}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }

  return (
    <div
      className={cn(
        "min-w-0 text-sm leading-6 text-muted-foreground",
        WRAP,
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
