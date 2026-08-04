"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { PdfPlaygroundCatalog } from "@/app/_components/pdf-playground-catalog";

const workbenchMinimumWidth = 940;

const PdfPlaygroundWorkbench = dynamic(
  () => import("@/app/_components/pdf-playground-workbench").then(
    (module) => module.PdfPlaygroundWorkbench,
  ),
  {
    loading: () => (
      <section
        aria-busy="true"
        aria-label="PDF playground workbench"
        className="pdfPlayground pdfPlaygroundWorkbenchLoading"
      >
        <span>Loading interactive workbench…</span>
      </section>
    ),
    ssr: false,
  },
);

export function PdfPlayground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showWorkbench, setShowWorkbench] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateMode = (width: number) => {
      const nextMode = width >= workbenchMinimumWidth;
      setShowWorkbench((currentMode) => currentMode === nextMode ? currentMode : nextMode);
    };

    updateMode(container.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const borderBox = Array.isArray(entry.borderBoxSize)
        ? entry.borderBoxSize[0]
        : entry.borderBoxSize;
      updateMode(borderBox?.inlineSize ?? entry.contentRect.width);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="pdfPlaygroundResponsive"
      data-mode={showWorkbench ? "workbench" : "catalog"}
      ref={containerRef}
    >
      {showWorkbench ? <PdfPlaygroundWorkbench /> : <PdfPlaygroundCatalog />}
    </div>
  );
}
