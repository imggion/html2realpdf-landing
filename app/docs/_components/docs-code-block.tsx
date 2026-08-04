"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/copy-text";

type CopyState = "idle" | "copied" | "error";

export function DocsCodeBlock(props: ComponentPropsWithoutRef<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<CopyState>("idle");

  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    },
    [],
  );

  async function copyCode() {
    const code = preRef.current?.textContent ?? "";
    if (!code) return;

    try {
      await copyText(code);
      setState("copied");
    } catch {
      setState("error");
    }

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setState("idle"), 1800);
  }

  const label = state === "copied" ? "Copied" : state === "error" ? "Retry" : "Copy";

  return (
    <div className="docsCodeBlock">
      <button
        aria-label={state === "copied" ? "Code copied to clipboard" : "Copy code to clipboard"}
        className="docsCodeCopyButton"
        onClick={copyCode}
        type="button"
      >
        <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
          <rect height="9" width="8" x="5.25" y="4.75" />
          <path d="M3.25 11.25h-1v-9h8v1" />
        </svg>
        {label}
      </button>
      <pre ref={preRef} {...props} />
      <span aria-live="polite" className="docsCodeCopyStatus" role="status">
        {state === "copied"
          ? "Code copied to clipboard."
          : state === "error"
            ? "Could not copy code. Try again."
            : ""}
      </span>
    </div>
  );
}
