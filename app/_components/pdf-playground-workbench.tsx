"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { track } from "@vercel/analytics";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Html2RealPdf,
  PdfDocument,
  PdfPreview,
} from "@imggion/html2realpdf";
import {
  playgroundCategories,
  playgroundExamples,
  type PlaygroundCategory,
  type PlaygroundExample,
  type PlaygroundExamplePayload,
  type PlaygroundSource,
} from "@/lib/playground-examples";
import { evaluatePlaygroundSource } from "@/lib/playground-sandbox";
import type { PlaygroundEditorTab } from "@/app/_components/playground-code-editor";

const PlaygroundCodeEditor = dynamic(
  () => import("@/app/_components/playground-code-editor").then(
    (module) => module.PlaygroundCodeEditor,
  ),
  {
    loading: () => (
      <div aria-busy="true" className="playgroundWorkbenchEditorLoading">
        Loading editor…
      </div>
    ),
    ssr: false,
  },
);

type RenderState = "loading-source" | "idle" | "rendering" | "ready" | "error";

type LastValidOutput = {
  filename: string;
  pageCount: number;
  slug: string;
  title: string;
};

type ActiveOutput = LastValidOutput & {
  layer: 0 | 1;
  pdf: PdfDocument;
  preview: PdfPreview;
};

const initialExample = playgroundExamples.find((example) => example.slug === "receipt-80mm")
  ?? playgroundExamples[0];
const sourceCache = new Map<string, PlaygroundSource>();

function DownloadIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20">
      <path d="M10 3v9m-4-4 4 4 4-4M4 15h12" />
    </svg>
  );
}

function cloneSource(source: PlaygroundSource): PlaygroundSource {
  return {
    html: source.html,
    css: source.css,
    page: { ...source.page },
  };
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "The PDF could not be generated.";
}

function isPlaygroundPayload(value: unknown, slug: string): value is PlaygroundExamplePayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<PlaygroundExamplePayload>;
  const source = payload.source as Partial<PlaygroundSource> | undefined;
  const page = source?.page;

  return payload.slug === slug
    && typeof payload.filename === "string"
    && typeof source?.html === "string"
    && typeof source.css === "string"
    && Boolean(page && typeof page === "object");
}

async function loadExampleSource(example: PlaygroundExample, signal: AbortSignal) {
  const cached = sourceCache.get(example.slug);
  if (cached) return cloneSource(cached);

  const response = await fetch(example.sourceUrl, { signal });
  if (!response.ok) {
    throw new Error(`Example source request failed with status ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!isPlaygroundPayload(payload, example.slug)) {
    throw new Error("The example source payload is invalid.");
  }

  sourceCache.set(example.slug, cloneSource(payload.source));
  return cloneSource(payload.source);
}

export function PdfPlaygroundWorkbench() {
  const [category, setCategory] = useState<PlaygroundCategory>("all");
  const [selectedSlug, setSelectedSlug] = useState(initialExample.slug);
  const [drafts, setDrafts] = useState<Record<string, PlaygroundSource>>({});
  const [editorRevisions, setEditorRevisions] = useState<Record<string, number>>({});
  const [renderState, setRenderState] = useState<RenderState>("loading-source");
  const [renderError, setRenderError] = useState("");
  const [statusMessage, setStatusMessage] = useState("Loading Studio invoice source…");
  const [lastValid, setLastValid] = useState<LastValidOutput | null>(null);
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0);

  const draftsRef = useRef(drafts);
  const originalsRef = useRef<Record<string, PlaygroundSource>>({});
  const renderAbortRef = useRef<AbortController | null>(null);
  const renderRunRef = useRef(0);
  const debounceTimeoutRef = useRef<number | null>(null);
  const rendererPromiseRef = useRef<Promise<Html2RealPdf> | null>(null);
  const rendererRef = useRef<Html2RealPdf | null>(null);
  const disposedRef = useRef(false);
  const previewLayerZeroRef = useRef<HTMLDivElement>(null);
  const previewLayerOneRef = useRef<HTMLDivElement>(null);
  const activeLayerRef = useRef<0 | 1>(0);
  const activeOutputRef = useRef<ActiveOutput | null>(null);

  const selectedExample = playgroundExamples.find((example) => example.slug === selectedSlug)
    ?? initialExample;
  const currentSource = drafts[selectedSlug];
  const filteredExamples = category === "all"
    ? playgroundExamples
    : playgroundExamples.filter((example) => example.categories.includes(category));

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  const getRenderer = useCallback(async () => {
    if (!rendererPromiseRef.current) {
      const rendererPromise = import("@imggion/html2realpdf")
        .then((module) => module.createRenderer({ execution: "worker" }))
        .then((renderer) => {
          rendererRef.current = renderer;
          return renderer;
        });
      rendererPromiseRef.current = rendererPromise;

      void rendererPromise.catch(() => {
        if (rendererPromiseRef.current === rendererPromise) {
          rendererPromiseRef.current = null;
        }
      });
    }

    return rendererPromiseRef.current;
  }, []);

  const renderSource = useCallback(async (
    source: PlaygroundSource,
    example: PlaygroundExample,
  ) => {
    const run = ++renderRunRef.current;
    renderAbortRef.current?.abort();
    const controller = new AbortController();
    renderAbortRef.current = controller;
    setRenderState("rendering");
    setRenderError("");
    setStatusMessage(`Rendering ${example.title}…`);

    let pendingPdf: PdfDocument | null = null;
    let pendingPreview: PdfPreview | null = null;

    try {
      const evaluatedDocument = await evaluatePlaygroundSource(source, controller.signal);
      if (controller.signal.aborted || renderRunRef.current !== run) return;

      const renderer = await getRenderer();
      if (disposedRef.current || controller.signal.aborted || renderRunRef.current !== run) return;

      pendingPdf = await renderer.render(evaluatedDocument, {
        page: source.page,
        cssProfile: "web",
        fallback: "error",
        layoutContext: "page",
        mediaType: "print",
        metadata: {
          title: example.title,
          creator: "@imggion/html2realpdf playground",
        },
        signal: controller.signal,
        viewport: { width: 1200, height: 1600 },
      });

      if (controller.signal.aborted || renderRunRef.current !== run) {
        pendingPdf.dispose();
        pendingPdf = null;
        return;
      }

      const nextLayer: 0 | 1 = activeLayerRef.current === 0 ? 1 : 0;
      const nextTarget = nextLayer === 0
        ? previewLayerZeroRef.current
        : previewLayerOneRef.current;
      if (!nextTarget) throw new Error("The PDF preview surface is not available.");

      nextTarget.replaceChildren();
      pendingPreview = await pendingPdf.preview(nextTarget, {
        ariaLabel: `${example.title} live PDF preview`,
        initialScale: "fit-width",
        maxPixelRatio: 2,
        padding: 18,
        showToolbar: true,
      });

      // The first fit happens before a multi-page preview has introduced its
      // vertical scrollbar. Fit once more against the final viewport width so
      // wide pages never lose their leading or trailing edge.
      await pendingPreview.fitToWidth();

      if (controller.signal.aborted || renderRunRef.current !== run) {
        pendingPreview.dispose();
        pendingPdf.dispose();
        pendingPreview = null;
        pendingPdf = null;
        return;
      }

      const previousOutput = activeOutputRef.current;
      const nextOutput: ActiveOutput = {
        filename: example.filename,
        layer: nextLayer,
        pageCount: pendingPdf.pageCount,
        pdf: pendingPdf,
        preview: pendingPreview,
        slug: example.slug,
        title: example.title,
      };

      activeOutputRef.current = nextOutput;
      activeLayerRef.current = nextLayer;
      nextTarget.dataset.active = "true";
      nextTarget.removeAttribute("aria-hidden");

      const previousTarget = nextLayer === 0
        ? previewLayerOneRef.current
        : previewLayerZeroRef.current;
      if (previousTarget) {
        previousTarget.dataset.active = "false";
        previousTarget.setAttribute("aria-hidden", "true");
      }

      pendingPdf = null;
      pendingPreview = null;
      previousOutput?.preview.dispose();
      previousOutput?.pdf.dispose();

      const outputSummary: LastValidOutput = {
        filename: nextOutput.filename,
        pageCount: nextOutput.pageCount,
        slug: nextOutput.slug,
        title: nextOutput.title,
      };
      setActiveLayer(nextLayer);
      setLastValid(outputSummary);
      setRenderState("ready");
      setRenderError("");
      setStatusMessage(
        `Ready. ${nextOutput.pageCount} ${nextOutput.pageCount === 1 ? "page" : "pages"}.`,
      );
      track("playground_live_pdf_rendered", {
        pages: nextOutput.pageCount,
        sample: example.slug,
      });
    } catch (error) {
      pendingPreview?.dispose();
      pendingPdf?.dispose();

      if (controller.signal.aborted || renderRunRef.current !== run) return;

      const detail = `Renderer error: ${errorMessage(error)}`;
      setRenderState("error");
      setRenderError(detail);
      setStatusMessage(detail);
    }
  }, [getRenderer]);

  useEffect(() => {
    disposedRef.current = false;

    return () => {
      disposedRef.current = true;
      renderRunRef.current += 1;
      renderAbortRef.current?.abort();
      if (debounceTimeoutRef.current !== null) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
      activeOutputRef.current?.preview.dispose();
      activeOutputRef.current?.pdf.dispose();
      activeOutputRef.current = null;

      const renderer = rendererRef.current;
      if (renderer) {
        renderer.dispose();
        rendererRef.current = null;
      } else {
        void rendererPromiseRef.current?.then((pendingRenderer) => pendingRenderer.dispose());
      }
    };
  }, []);

  useEffect(() => {
    const existingDraft = draftsRef.current[selectedSlug];
    if (existingDraft) return;

    const controller = new AbortController();

    void loadExampleSource(selectedExample, controller.signal).then((source) => {
      if (controller.signal.aborted) return;

      originalsRef.current[selectedSlug] = cloneSource(source);
      setDrafts((currentDrafts) => currentDrafts[selectedSlug]
        ? currentDrafts
        : { ...currentDrafts, [selectedSlug]: source });
      setRenderState("idle");
      setStatusMessage(`${selectedExample.title} source loaded.`);
    }).catch((error) => {
      if (controller.signal.aborted) return;

      const detail = `Example source error: ${errorMessage(error)}`;
      setRenderState("error");
      setRenderError(detail);
      setStatusMessage(detail);
    });

    return () => controller.abort();
  }, [selectedExample, selectedSlug]);

  useEffect(() => {
    if (!currentSource) return;

    if (debounceTimeoutRef.current !== null) {
      window.clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = window.setTimeout(() => {
      debounceTimeoutRef.current = null;
      void renderSource(cloneSource(currentSource), selectedExample);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current !== null) {
        window.clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [currentSource, renderSource, selectedExample]);

  function updateSource(tab: PlaygroundEditorTab, value: string) {
    setDrafts((currentDrafts) => {
      const currentDraft = currentDrafts[selectedSlug];
      if (!currentDraft || currentDraft[tab] === value) return currentDrafts;

      return {
        ...currentDrafts,
        [selectedSlug]: { ...currentDraft, [tab]: value },
      };
    });
  }

  function selectExample(example: PlaygroundExample) {
    renderRunRef.current += 1;
    renderAbortRef.current?.abort();
    setRenderError("");
    setSelectedSlug(example.slug);

    if (draftsRef.current[example.slug]) {
      setRenderState("idle");
      setStatusMessage(`${example.title} source loaded.`);
    } else {
      setRenderState("loading-source");
      setStatusMessage(`Loading ${example.title} source…`);
    }
  }

  function resetExample() {
    const original = originalsRef.current[selectedSlug];
    if (!original) return;

    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [selectedSlug]: cloneSource(original),
    }));
    setEditorRevisions((revisions) => ({
      ...revisions,
      [selectedSlug]: (revisions[selectedSlug] ?? 0) + 1,
    }));
    setStatusMessage(`${selectedExample.title} reset to its original source.`);
  }

  function forceRender() {
    if (!currentSource) return;
    if (debounceTimeoutRef.current !== null) {
      window.clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    void renderSource(cloneSource(currentSource), selectedExample);
  }

  function downloadLatestPdf() {
    const output = activeOutputRef.current;
    if (!output) return;

    output.pdf.download(output.filename);
    track("playground_pdf_downloaded", { sample: output.slug, source: "workbench" });
  }

  const previewTitle = lastValid?.title ?? selectedExample.title;
  const visibleStatus = renderState === "ready" && lastValid
    ? `Ready · ${lastValid.pageCount} ${lastValid.pageCount === 1 ? "page" : "pages"}`
    : renderState === "rendering"
      ? "Rendering…"
      : renderState === "loading-source"
        ? "Loading source…"
        : renderState === "error"
          ? "Render error"
          : "Ready to render";

  return (
    <section className="pdfPlayground pdfPlaygroundWorkbench" aria-label="Interactive PDF playground">
      <div className="playgroundWorkbenchLeft">
        <section className="playgroundWorkbenchEditor" aria-label="Source editor">
          {currentSource ? (
            <PlaygroundCodeEditor
              documentKey={`${selectedSlug}:${editorRevisions[selectedSlug] ?? 0}`}
              isRendering={renderState === "rendering"}
              onChange={updateSource}
              onReset={resetExample}
              onRun={forceRender}
              source={currentSource}
            />
          ) : (
            <div aria-busy={renderState === "loading-source"} className="playgroundWorkbenchEditorLoading">
              {renderState === "error" ? "Source unavailable" : "Loading source…"}
            </div>
          )}
        </section>

        <section aria-labelledby="playground-examples-title" className="playgroundWorkbenchExamples">
          <header className="playgroundWorkbenchExamplesHeader">
            <h2 id="playground-examples-title">Examples</h2>
            <div aria-label="Filter examples" className="playgroundWorkbenchFilters">
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
          </header>
          <p className="srOnly" role="status">
            Showing {filteredExamples.length} PDF {filteredExamples.length === 1 ? "example" : "examples"}.
          </p>
          <div className="playgroundWorkbenchExampleGrid">
            {filteredExamples.map((example) => {
              const isSelected = example.slug === selectedSlug;
              return (
                <button
                  aria-pressed={isSelected}
                  className="playgroundWorkbenchExample"
                  data-selected={isSelected}
                  key={example.slug}
                  onClick={() => {
                    selectExample(example);
                    track("playground_example_selected", { sample: example.slug });
                  }}
                  type="button"
                >
                  <span className="playgroundWorkbenchExampleThumbnail">
                    <Image
                      alt=""
                      fill
                      sizes="(max-width: 1280px) 220px, 320px"
                      src={example.thumbnailUrl}
                    />
                  </span>
                  <span className="playgroundWorkbenchExampleDetails">
                    <strong>{example.title}</strong>
                    <span>{example.format} · {example.orientation}</span>
                    {isSelected ? <em>Selected</em> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <section
        aria-busy={renderState === "rendering"}
        aria-labelledby="playground-preview-title"
        className="playgroundWorkbenchPreview"
      >
        <header className="playgroundWorkbenchPreviewHeader">
          <div>
            <span>LIVE PDF PREVIEW</span>
            <strong id="playground-preview-title">{previewTitle}</strong>
            <small data-state={renderState}>{visibleStatus}</small>
          </div>
          <button
            disabled={!lastValid}
            onClick={downloadLatestPdf}
            type="button"
          >
            <DownloadIcon />
            Download PDF
          </button>
        </header>

        <div className="playgroundWorkbenchPreviewViewport">
          <div
            aria-hidden={activeLayer !== 0 || !lastValid}
            className="playgroundWorkbenchPreviewLayer"
            data-active={activeLayer === 0 && Boolean(lastValid)}
            ref={previewLayerZeroRef}
          />
          <div
            aria-hidden={activeLayer !== 1 || !lastValid}
            className="playgroundWorkbenchPreviewLayer"
            data-active={activeLayer === 1 && Boolean(lastValid)}
            ref={previewLayerOneRef}
          />

          {!lastValid ? (
            <div aria-hidden="true" className="playgroundWorkbenchPreviewPlaceholder">
              <span />
              <span />
              <span />
            </div>
          ) : null}

          {renderState === "rendering" ? (
            <div className="playgroundWorkbenchRenderingBadge">Rendering latest changes…</div>
          ) : null}

          {renderError ? (
            <div className="playgroundWorkbenchError">
              <strong>Last valid preview preserved</strong>
              <span>{renderError}</span>
            </div>
          ) : null}
        </div>
        <p aria-atomic="true" className="srOnly" role="status">{statusMessage}</p>
      </section>
    </section>
  );
}
