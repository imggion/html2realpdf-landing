"use client";

import { useState } from "react";

const pageWidth = 793;
const pageHeight = 1118;
const pagePadding = 52;

type WindowDownloadButtonProps = {
  filename: string;
  windowTitle: string;
};

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M10 3v9m-4-4 4 4 4-4M4 15h12" />
    </svg>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "The card PDF could not be generated.";
}

function createExportStage(source: HTMLElement) {
  const sourceWidth = source.offsetWidth;
  const sourceHeight = source.offsetHeight;

  if (sourceWidth < 1 || sourceHeight < 1) {
    throw new Error("The card is not ready to export yet.");
  }

  const scale = Math.min(
    1,
    (pageWidth - pagePadding * 2) / sourceWidth,
    (pageHeight - pagePadding * 2) / sourceHeight,
  );

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    height: `${pageHeight}px`,
    left: "-10000px",
    pointerEvents: "none",
    position: "fixed",
    top: "0",
    width: `${pageWidth}px`,
  });

  const page = document.createElement("div");
  page.className = "pdfCardExportPage";
  page.style.width = `${pageWidth}px`;
  page.style.height = `${pageHeight}px`;

  const frame = document.createElement("div");
  frame.className = "pdfCardExportFrame";

  const scaledCard = document.createElement("div");
  scaledCard.className = "pdfCardExportScale";
  scaledCard.style.width = `${sourceWidth}px`;

  if (scale === 1) {
    frame.classList.add("pdfCardExportFrameNatural");
    frame.style.width = `${sourceWidth}px`;
    scaledCard.classList.add("pdfCardExportScaleNatural");
  } else {
    frame.style.width = `${sourceWidth * scale}px`;
    frame.style.height = `${sourceHeight * scale}px`;
    scaledCard.style.height = `${sourceHeight}px`;
    scaledCard.style.transform = `scale(${scale})`;
  }

  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-pdf-download-control]").forEach((control) => {
    control.remove();
  });
  clone.querySelectorAll<HTMLElement>(".windowControls i").forEach((control, index) => {
    control.textContent = ["_", "[]", "x"][index] ?? "";
  });
  clone.querySelectorAll<HTMLElement>(".pipeline > b").forEach((arrow) => {
    arrow.textContent = "->";
  });
  clone.removeAttribute("data-downloadable-window");
  clone.style.width = `${sourceWidth}px`;
  clone.style.maxWidth = "none";

  scaledCard.append(clone);
  frame.append(scaledCard);
  page.append(frame);
  host.append(page);
  document.body.append(host);

  return { host, page };
}

export function WindowDownloadButton({
  filename,
  windowTitle,
}: WindowDownloadButtonProps) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function handleDownload(event: React.MouseEvent<HTMLButtonElement>) {
    const source = event.currentTarget.closest<HTMLElement>("[data-downloadable-window]");
    if (!source || busy) return;

    setBusy(true);
    setStatus(`Generating ${windowTitle} PDF…`);

    let host: HTMLElement | null = null;

    try {
      const stage = createExportStage(source);
      host = stage.host;

      const { renderPdf } = await import("@imggion/html2realpdf");
      const pdf = await renderPdf(stage.page, {
        page: { format: "a4", unit: "pt", margin: 0 },
        cssProfile: "web",
        fallback: "error",
        layoutContext: "source",
        metadata: {
          title: windowTitle,
          creator: "html2realpdf landing page",
        },
      });

      try {
        pdf.download(filename);
        setStatus(`${windowTitle} PDF downloaded.`);
      } finally {
        pdf.dispose();
      }
    } catch (error) {
      setStatus(`Download failed: ${getErrorMessage(error)}`);
    } finally {
      host?.remove();
      setBusy(false);
    }
  }

  return (
    <span className="windowDownloadControl" data-pdf-download-control>
      <button
        aria-busy={busy}
        aria-label={`Download ${windowTitle} as PDF`}
        className="windowDownloadButton"
        disabled={busy}
        onClick={handleDownload}
        title={`Download ${windowTitle} as PDF`}
        type="button"
      >
        {busy ? <span aria-hidden="true">…</span> : <DownloadIcon />}
      </button>
      <span aria-live="polite" className="srOnly">
        {status}
      </span>
    </span>
  );
}
