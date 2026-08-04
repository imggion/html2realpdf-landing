"use client";

import Image from "next/image";
import { track } from "@vercel/analytics";
import { useRef, useState } from "react";
import {
  playgroundCategories,
  playgroundExamples,
  type PlaygroundCategory,
  type PlaygroundExample,
} from "@/lib/playground-examples";

type PreviewState = "idle" | "loading" | "ready" | "error";

function DownloadIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20">
      <path d="M10 3v9m-4-4 4 4 4-4M4 15h12" />
    </svg>
  );
}

function PreviewIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20">
      <path d="M2.5 10s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5Z" />
      <circle cx="10" cy="10" r="2.25" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20">
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

function pagesLabel(pageCount: number) {
  return `${pageCount} ${pageCount === 1 ? "page" : "pages"}`;
}

export function PdfPlaygroundCatalog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previewTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [category, setCategory] = useState<PlaygroundCategory>("all");
  const [selected, setSelected] = useState<PlaygroundExample | null>(null);
  const [previewState, setPreviewState] = useState<PreviewState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const filteredExamples = category === "all"
    ? playgroundExamples
    : playgroundExamples.filter((example) => example.categories.includes(category));

  function openPreview(example: PlaygroundExample, trigger: HTMLButtonElement) {
    previewTriggerRef.current = trigger;
    setSelected(example);
    setPreviewState("loading");
    setStatusMessage(`Loading ${example.title} preview…`);
    track("playground_pdf_previewed", { sample: example.slug });

    window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog?.open) dialog?.showModal();
      closeButtonRef.current?.focus();
    });
  }

  function closePreview() {
    dialogRef.current?.close();
  }

  function handleDialogClose() {
    setSelected(null);
    setPreviewState("idle");
    setStatusMessage("");
    previewTriggerRef.current?.focus();
  }

  function trackDownload(example: PlaygroundExample, source: "card" | "preview") {
    track("playground_pdf_downloaded", { sample: example.slug, source });
  }

  return (
    <section className="pdfPlayground" aria-label="PDF output catalog">
      <div className="pdfPlaygroundFilters" aria-label="Filter PDF examples">
        {playgroundCategories.map((item) => (
          <button
            aria-pressed={category === item.id}
            key={item.id}
            onClick={() => setCategory(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="srOnly" role="status">
        Showing {filteredExamples.length} PDF {filteredExamples.length === 1 ? "example" : "examples"}.
      </p>

      <div className="pdfPlaygroundGrid">
        {filteredExamples.map((example) => (
          <article className="pdfPlaygroundCard" key={example.slug}>
            <div
              className="pdfPlaygroundThumbnail"
              data-orientation={example.orientation.toLowerCase()}
            >
              <Image
                alt={example.thumbnailAlt}
                fill
                loading={example.slug === "strategy-deck-16x9" ? "eager" : "lazy"}
                sizes="(max-width: 560px) calc(100vw - 64px), (max-width: 1120px) 44vw, 310px"
                src={example.thumbnailUrl}
              />
              <span>{example.format}</span>
            </div>
            <div className="pdfPlaygroundCardBody">
              <div className="pdfPlaygroundCardHeading">
                <h3>{example.title}</h3>
              </div>
              <p className="pdfPlaygroundMeta">
                {example.format} · {example.orientation} · {pagesLabel(example.pageCount)} · {example.fileSize}
              </p>
              <div className="pdfPlaygroundCardActions">
                <button
                  className="pdfPlaygroundPreviewButton"
                  onClick={(event) => openPreview(example, event.currentTarget)}
                  type="button"
                >
                  <PreviewIcon />
                  Preview PDF
                </button>
                <a
                  download={`${example.slug}.pdf`}
                  href={example.pdfUrl}
                  onClick={() => trackDownload(example, "card")}
                >
                  <DownloadIcon />
                  Download PDF
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      <dialog
        aria-describedby="pdf-playground-preview-description"
        aria-labelledby="pdf-playground-preview-title"
        className="pdfPlaygroundDialog"
        onCancel={(event) => {
          event.preventDefault();
          closePreview();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closePreview();
        }}
        onClose={handleDialogClose}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closePreview();
          }
        }}
        ref={dialogRef}
      >
        {selected ? (
          <div className="pdfPlaygroundDialogFrame">
            <header className="pdfPlaygroundDialogHeader">
              <div>
                <span>PDF_PREVIEW · {selected.format}</span>
                <strong id="pdf-playground-preview-title">{selected.title}</strong>
                <p id="pdf-playground-preview-description">
                  {selected.orientation} · {pagesLabel(selected.pageCount)} · {selected.fileSize}
                </p>
              </div>
              <div className="pdfPlaygroundDialogActions">
                <a
                  download={`${selected.slug}.pdf`}
                  href={selected.pdfUrl}
                  onClick={() => trackDownload(selected, "preview")}
                >
                  <DownloadIcon />
                  Download PDF
                </a>
                <button
                  aria-label="Close PDF preview"
                  onClick={closePreview}
                  ref={closeButtonRef}
                  type="button"
                >
                  <CloseIcon />
                </button>
              </div>
            </header>

            <div
              aria-busy={previewState === "loading"}
              className="pdfPlaygroundPreviewViewport"
            >
              {previewState === "loading" ? (
                <div className="pdfPlaygroundPreviewLoading" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              ) : null}
              {previewState === "error" ? (
                <div className="pdfPlaygroundPreviewError">
                  <strong>Preview unavailable</strong>
                  <p>Download the PDF to open it in your reader.</p>
                  <a
                    download={`${selected.slug}.pdf`}
                    href={selected.pdfUrl}
                    onClick={() => trackDownload(selected, "preview")}
                  >
                    <DownloadIcon />
                    Download PDF
                  </a>
                </div>
              ) : null}
              <iframe
                className="pdfPlaygroundPreviewFrame"
                data-ready={previewState === "ready"}
                onError={() => {
                  setPreviewState("error");
                  setStatusMessage("Preview unavailable. Download the PDF to open it in your reader.");
                }}
                onLoad={() => {
                  setPreviewState("ready");
                  setStatusMessage(`${selected.title} preview loaded. ${pagesLabel(selected.pageCount)}.`);
                }}
                src={`${selected.pdfUrl}#view=FitH&toolbar=0&navpanes=0`}
                title={`${selected.title} PDF preview`}
              />
            </div>
            <p className="srOnly" role="status">{statusMessage}</p>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
