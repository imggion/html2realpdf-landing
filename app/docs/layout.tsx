import type { ReactNode } from "react";
import { docsSource } from "@/lib/docs-source";
import { DocsShell } from "./_components/docs-shell";
import "./docs.css";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsShell tree={docsSource.getPageTree()}>{children}</DocsShell>;
}
