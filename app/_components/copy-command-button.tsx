"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { copyText } from "@/lib/copy-text";

type CopyState = "idle" | "copied" | "error";

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <rect height="10" width="10" x="6" y="6" />
      <path d="M4 14H3V3h11v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="m4 10 4 4 8-9" />
    </svg>
  );
}

export function CopyCommandButton({ command }: Readonly<{ command: string }>) {
  const [state, setState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  async function handleCopy() {
    try {
      await copyText(command);
      setState("copied");
      track("install_command_copied");
    } catch {
      setState("error");
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState("idle"), 1800);
  }

  const label = state === "copied" ? "Copied" : state === "error" ? "Retry" : "Copy";

  return (
    <button
      aria-label={state === "copied" ? "Install command copied" : "Copy install command"}
      className="copyCommandButton"
      onClick={handleCopy}
      type="button"
    >
      {state === "copied" ? <CheckIcon /> : <CopyIcon />}
      <span aria-live="polite" className="copyCommandLabel">
        {label}
      </span>
    </button>
  );
}
