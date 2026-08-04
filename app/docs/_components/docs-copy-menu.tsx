"use client";

import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/copy-text";

type CopyMode = "llm" | "text" | "markdown";

type DocsCopyMenuProps = {
  description: string;
  markdown: string;
  pageUrl: string;
  title: string;
};

const actions: Array<{ kind: string; label: string; mode: CopyMode }> = [
  { kind: "AI", label: "Copy for LLM", mode: "llm" },
  { kind: "TXT", label: "Copy text", mode: "text" },
  { kind: "MD", label: "Copy Markdown", mode: "markdown" },
];

function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/^---\n[\s\S]*?\n---\n?/, "")
    .replace(/```[^\n]*\n([\s\S]*?)```/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function DocsCopyMenu({
  description,
  markdown,
  pageUrl,
  title,
}: DocsCopyMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!detailsRef.current?.contains(event.target as Node)) {
        detailsRef.current?.removeAttribute("open");
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && detailsRef.current?.open) {
        detailsRef.current.removeAttribute("open");
        summaryRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function handleCopy(mode: CopyMode, label: string) {
    const pageMarkdown = `# ${title}\n\n${description}\n\n${markdown.trim()}`;
    const absoluteUrl = new URL(pageUrl, window.location.origin).toString();
    const value = mode === "text"
      ? markdownToPlainText(pageMarkdown)
      : mode === "llm"
        ? `Source: ${absoluteUrl}\n\n${pageMarkdown}`
        : pageMarkdown;

    try {
      await copyText(value);
      setStatus(`${label} copied.`);
    } catch {
      setStatus("Copy failed. Try again.");
    }

    detailsRef.current?.removeAttribute("open");
    summaryRef.current?.focus();
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus(""), 2200);
  }

  return (
    <div className="docsCopyActions">
      <details className="docsCopyMenu" ref={detailsRef}>
        <summary ref={summaryRef}>Copy</summary>
        <div className="docsCopyList">
          {actions.map((action) => (
            <button
              key={action.mode}
              onClick={() => handleCopy(action.mode, action.label)}
              type="button"
            >
              <span aria-hidden="true" className="docsCopyKind">{action.kind}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </details>
      <span aria-live="polite" className="docsCopyStatus" role="status">
        {status}
      </span>
    </div>
  );
}
