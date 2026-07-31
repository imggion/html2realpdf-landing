"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { PdfDocument, PdfPreview } from "@imggion/html2realpdf";
import { track } from "@vercel/analytics";

type Engine = "screenshot" | "real";
type DemoAction = `${Engine}-${"download" | "preview"}`;
type AnalyticsEngine = "html2pdf.js" | "html2realpdf";
type PreviewState =
  | {
      engine: "screenshot";
      pageCount: number;
      pages: Array<{ height: number; url: string; width: number }>;
    }
  | {
      engine: "real";
      pageCount: number;
    };

const screenshotFilename = "northstar-analytics-screenshot.pdf";
const realFilename = "northstar-analytics-real.pdf";
const analyticsEngine: Record<Engine, AnalyticsEngine> = {
  real: "html2realpdf",
  screenshot: "html2pdf.js",
};

const screenshotOptions = {
  margin: 0,
  filename: screenshotFilename,
  image: { type: "jpeg" as const, quality: 0.96 },
  enableLinks: true,
  html2canvas: {
    backgroundColor: "#ffffff",
    logging: false,
    scale: 2,
    useCORS: true,
  },
  jsPDF: {
    unit: "mm",
    format: "a4",
    orientation: "portrait" as const,
  },
};

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M10 3v9m-4-4 4 4 4-4M4 15h12" />
    </svg>
  );
}

function PreviewIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M2.5 10s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5Z" />
      <circle cx="10" cy="10" r="2.25" />
    </svg>
  );
}

function RevenueChart() {
  return (
    <svg
      aria-label="Quarterly revenue bar chart"
      role="img"
      viewBox="0 0 680 250"
    >
      <rect width="680" height="250" fill="#ffffff" />
      <line x1="58" y1="82" x2="650" y2="82" stroke="#fde9d3" />
      <line x1="58" y1="146" x2="650" y2="146" stroke="#fde9d3" />
      <line x1="58" y1="210" x2="650" y2="210" stroke="#122445" />
      <line x1="58" y1="40" x2="58" y2="210" stroke="#122445" />
      <rect x="95" y="128" width="72" height="82" fill="#fde9d3" stroke="#122445" />
      <rect x="215" y="108" width="72" height="102" fill="#f8cb78" stroke="#122445" />
      <rect x="335" y="84" width="72" height="126" fill="#f3a116" stroke="#122445" />
      <rect x="455" y="52" width="72" height="158" fill="#122445" stroke="#122445" />
      <text x="112" y="232" fontSize="13" fill="#122445">Q3 25</text>
      <text x="232" y="232" fontSize="13" fill="#122445">Q4 25</text>
      <text x="352" y="232" fontSize="13" fill="#122445">Q1 26</text>
      <text x="472" y="232" fontSize="13" fill="#122445">Q2 26</text>
      <text x="106" y="116" fontSize="13" fontWeight="700" fill="#122445">€3.42M</text>
      <text x="226" y="96" fontSize="13" fontWeight="700" fill="#122445">€3.77M</text>
      <text x="346" y="72" fontSize="13" fontWeight="700" fill="#122445">€4.11M</text>
      <text x="466" y="40" fontSize="13" fontWeight="700" fill="#122445">€4.82M</text>
    </svg>
  );
}

function CustomerMixChart() {
  return (
    <svg
      aria-label="Customer segment stacked bar chart"
      role="img"
      viewBox="0 0 680 220"
    >
      <rect width="680" height="220" fill="#ffffff" />
      <rect x="70" y="58" width="270" height="64" fill="#122445" />
      <rect x="340" y="58" width="190" height="64" fill="#f3a116" />
      <rect x="530" y="58" width="90" height="64" fill="#fde9d3" />
      <rect x="70" y="58" width="550" height="64" fill="none" stroke="#122445" />
      <text x="165" y="95" fontSize="16" fill="#fde9d3">Enterprise 45%</text>
      <text x="365" y="95" fontSize="16" fontWeight="700" fill="#122445">Mid-market 32%</text>
      <text x="542" y="95" fontSize="14" fontWeight="700" fill="#122445">SMB 15%</text>
      <text x="70" y="160" fontSize="13" fill="#122445">
        Enterprise expansion revenue increased 28% quarter over quarter.
      </text>
      <text x="70" y="185" fontSize="13" fill="#57647a">
        Remaining 8%: partners and marketplace channels.
      </text>
    </svg>
  );
}

function ReportTitleBar({ page }: { page: string }) {
  return (
    <div className="analyticsTitleBar">
      <span>HTML2REALPDF · REPORT SYSTEM</span>
      <span className="analyticsTitleFile">NORTHSTAR_Q2_2026.PDF</span>
      <span className="analyticsTitlePage">PAGE {page}</span>
    </div>
  );
}

function ReportFooter({ page }: { page: string }) {
  return (
    <footer className="analyticsPageFooter">
      <span>HTML2REALPDF · NATIVE DOCUMENT</span>
      <span>{page} / 03</span>
    </footer>
  );
}

function AnalyticsReportPages() {
  return (
    <>
      <section className="analyticsPage" aria-label="Executive performance overview">
        <ReportTitleBar page="01" />
        <header className="analyticsCover">
          <p className="analyticsEyebrow">QUARTERLY BUSINESS REVIEW</p>
          <p className="analyticsDocumentTitle">Northstar Commerce Analytics</p>
          <p>Executive performance report — Q2 2026</p>
        </header>

        <table className="analyticsKpis">
          <caption>Key business metrics</caption>
          <tbody>
            <tr>
              <td><span>NET REVENUE</span><strong>€4.82M</strong><small className="analyticsPositive">+18.4% YoY</small></td>
              <td><span>GROSS MARGIN</span><strong>64.2%</strong><small className="analyticsPositive">+3.1 pts</small></td>
              <td><span>ACTIVE CUSTOMERS</span><strong>28,640</strong><small className="analyticsPositive">+11.8%</small></td>
              <td><span>CHURN</span><strong>2.7%</strong><small className="analyticsNegative">+0.3 pts</small></td>
            </tr>
          </tbody>
        </table>

        <p className="analyticsSectionTitle">Revenue trend</p>
        <div className="analyticsChart"><RevenueChart /></div>
        <p className="analyticsInsight">
          <strong>Executive insight:</strong> Revenue acceleration was driven by
          enterprise expansion and a 9% increase in average order value.
        </p>
        <ReportFooter page="01" />
      </section>

      <section className="analyticsPage analyticsPageBreak" aria-label="Regional performance">
        <ReportTitleBar page="02" />
        <p className="analyticsSectionTitle">Regional performance</p>
        <table className="analyticsDataTable">
          <caption>Revenue and margin by region</caption>
          <thead>
            <tr><th>Region</th><th>Revenue</th><th>YoY growth</th><th>Gross margin</th><th>Signal</th></tr>
          </thead>
          <tbody>
            <tr className="analyticsGood"><td>United Kingdom</td><td>€1.54M</td><td>+22.6%</td><td>66.8%</td><td>Strong</td></tr>
            <tr className="analyticsGood"><td>DACH</td><td>€1.21M</td><td>+19.4%</td><td>65.1%</td><td>Strong</td></tr>
            <tr><td>France</td><td>€0.86M</td><td>+13.2%</td><td>62.7%</td><td>Stable</td></tr>
            <tr className="analyticsWatch"><td>Southern Europe</td><td>€0.71M</td><td>+8.1%</td><td>59.9%</td><td>Watch</td></tr>
            <tr><td>Nordics</td><td>€0.50M</td><td>+16.7%</td><td>64.5%</td><td>Stable</td></tr>
          </tbody>
        </table>

        <p className="analyticsSectionTitle">Customer mix</p>
        <div className="analyticsChart"><CustomerMixChart /></div>
        <ReportFooter page="02" />
      </section>

      <section className="analyticsPage analyticsPageBreak analyticsAppendix" aria-label="Appendix and methodology">
        <ReportTitleBar page="03" />
        <p className="analyticsSectionTitle">Appendix and methodology</p>
        <p><strong>Revenue recognition:</strong> Net revenue excludes VAT, refunds, marketplace fees, and promotional credits. Subscription revenue is recognized daily over the contracted service period.</p>
        <p><strong>Customer definitions:</strong> Active customers completed at least one paid transaction during the trailing 90-day period. Churn represents customers becoming inactive during the quarter divided by active customers at quarter start.</p>
        <p><strong>Data quality:</strong> Figures reconcile to the management ledger as of 8 July 2026. Currency conversion uses the European Central Bank monthly average rate for each transaction month.</p>

        <table className="analyticsDataTable">
          <caption>Metric sources and ownership</caption>
          <thead><tr><th>Metric</th><th>Source</th><th>Refresh cadence</th><th>Owner</th></tr></thead>
          <tbody>
            <tr><td>Revenue and margin</td><td>Finance warehouse</td><td>Daily</td><td>Finance Operations</td></tr>
            <tr><td>Customer activity</td><td>Product analytics</td><td>Hourly</td><td>Data Platform</td></tr>
            <tr><td>Regional attribution</td><td>Billing profile</td><td>Daily</td><td>Commercial Analytics</td></tr>
          </tbody>
        </table>

        <footer className="analyticsTry">
          <strong>TRY THIS IN THE PDF</strong>
          <span>Select “Gross margin”, copy €4.82M, or search for “Southern Europe”.</span>
        </footer>
        <ReportFooter page="03" />
      </section>
    </>
  );
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "The PDF could not be generated. Please try again.";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function PdfComparisonDemo() {
  const reportRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const previewTriggerRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef(false);
  const previewImageUrlsRef = useRef<string[]>([]);
  const realPreviewTargetRef = useRef<HTMLDivElement>(null);
  const realPdfRef = useRef<PdfDocument | null>(null);
  const realPreviewRef = useRef<PdfPreview | null>(null);
  const realPreviewRunRef = useRef(0);
  const [busy, setBusy] = useState<DemoAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [showRealToolbar, setShowRealToolbar] = useState(false);

  function disposePreviewAssets() {
    realPreviewRunRef.current += 1;
    realPreviewRef.current?.dispose();
    realPreviewRef.current = null;
    realPdfRef.current?.dispose();
    realPdfRef.current = null;
    previewImageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewImageUrlsRef.current = [];
  }

  useEffect(() => {
    return () => {
      realPreviewRunRef.current += 1;
      realPreviewRef.current?.dispose();
      realPdfRef.current?.dispose();
      previewImageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    if (!preview) {
      if (returnFocusRef.current) {
        returnFocusRef.current = false;
        previewTriggerRef.current?.focus();
      }
      return;
    }

    if (!previewRef.current) return;

    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    previewRef.current.focus({ preventScroll: true });
    previewRef.current.scrollIntoView({ behavior, block: "start" });
  }, [preview]);

  useEffect(() => {
    if (preview?.engine !== "real") return;

    const pdf = realPdfRef.current;
    const target = realPreviewTargetRef.current;
    if (!pdf || !target) return;

    realPreviewRef.current?.dispose();
    realPreviewRef.current = null;

    const run = ++realPreviewRunRef.current;
    let cancelled = false;

    void pdf.preview(target, {
      ariaLabel: "Real PDF preview rendered by html2realpdf",
      initialScale: "fit-width",
      maxPixelRatio: 2,
      padding: 0,
      showToolbar: showRealToolbar,
    }).then((nativePreview) => {
      if (cancelled || realPreviewRunRef.current !== run) {
        nativePreview.dispose();
        return;
      }
      realPreviewRef.current = nativePreview;
    }).catch((caughtError) => {
      if (cancelled || realPreviewRunRef.current !== run) return;

      realPdfRef.current?.dispose();
      realPdfRef.current = null;
      returnFocusRef.current = true;
      setError(errorMessage(caughtError));
      setPreview(null);
    });

    return () => {
      cancelled = true;
    };
  }, [preview, showRealToolbar]);

  async function createScreenshotPdf() {
    const report = reportRef.current;
    if (!report) throw new Error("The source report is not ready yet.");

    const { default: html2pdf } = await import("html2pdf.js");
    const output = await html2pdf()
      .set(screenshotOptions)
      .from(report)
      .outputPdf("blob");

    if (!(output instanceof Blob)) {
      throw new Error("html2pdf.js returned an unexpected PDF result.");
    }

    return output;
  }

  async function createRealPdf() {
    const report = reportRef.current;
    if (!report) throw new Error("The source report is not ready yet.");

    const { renderPdf } = await import("@imggion/html2realpdf");
    return renderPdf(report, {
      page: { format: "a4", unit: "pt", margin: 0 },
      cssProfile: "web",
      fallback: "error",
      layoutContext: "page",
      metadata: {
        title: "Northstar Commerce Analytics Q2 2026",
        author: "Northstar Commerce",
        subject: "Quarterly business review PDF comparison",
        keywords: ["analytics", "revenue", "quarterly report", "native PDF"],
        creator: "@imggion/html2realpdf",
      },
    });
  }

  async function createPdfPreview(blob: Blob) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(await blob.arrayBuffer()),
    });
    const pdfDocument = await loadingTask.promise;

    const pages: Array<{ height: number; url: string; width: number }> = [];

    try {
      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
        const page = await pdfDocument.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1.75, 940 / baseViewport.width);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });

        if (!context) throw new Error("The browser could not create a PDF preview canvas.");

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;

        const imageBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((result) => {
            if (result) resolve(result);
            else reject(new Error("The browser could not encode the PDF preview."));
          }, "image/png");
        });

        pages.push({
          height: canvas.height,
          url: URL.createObjectURL(imageBlob),
          width: canvas.width,
        });
      }

      return { pageCount: pdfDocument.numPages, pages };
    } catch (caughtError) {
      pages.forEach((page) => URL.revokeObjectURL(page.url));
      throw caughtError;
    } finally {
      await loadingTask.destroy();
    }
  }

  async function handleDownload(engine: Engine) {
    const action: DemoAction = `${engine}-download`;
    setBusy(action);
    setError(null);

    try {
      if (engine === "screenshot") {
        downloadBlob(await createScreenshotPdf(), screenshotFilename);
      } else {
        const pdf = await createRealPdf();
        try {
          pdf.download(realFilename);
        } finally {
          pdf.dispose();
        }
      }

      track("demo_pdf_downloaded", { engine: analyticsEngine[engine] });
    } catch (caughtError) {
      setError(errorMessage(caughtError));
    } finally {
      setBusy(null);
    }
  }

  async function handlePreview(engine: Engine, trigger: HTMLButtonElement) {
    const action: DemoAction = `${engine}-preview`;
    previewTriggerRef.current = trigger;
    setBusy(action);
    setError(null);
    disposePreviewAssets();
    setShowRealToolbar(false);
    setPreview(null);

    try {
      if (engine === "screenshot") {
        const renderedPreview = await createPdfPreview(await createScreenshotPdf());
        previewImageUrlsRef.current = renderedPreview.pages.map((page) => page.url);
        setPreview({ engine, ...renderedPreview });
      } else {
        const pdf = await createRealPdf();
        realPdfRef.current = pdf;
        setPreview({ engine: "real", pageCount: pdf.pageCount });
      }

      track("demo_pdf_previewed", { engine: analyticsEngine[engine] });
    } catch (caughtError) {
      disposePreviewAssets();
      setError(errorMessage(caughtError));
    } finally {
      setBusy(null);
    }
  }

  function closePreview() {
    disposePreviewAssets();
    returnFocusRef.current = true;
    setShowRealToolbar(false);
    setPreview(null);
  }

  const isBusy = busy !== null;

  return (
    <div className="demoWindow window" aria-busy={isBusy}>
      <div className="windowTitlebar">
        <span>PDF_OUTPUT_LAB.EXE</span>
        <span className="windowControls" aria-hidden="true">
          <i>_</i><i>□</i><i>×</i>
        </span>
      </div>

      <div className="demoWorkspace">
        <div className="demoSourcePanel" data-nosnippet>
          <div className="demoPanelBar">
            <span>NORTHSTAR_ANALYTICS.HTML</span>
            <span>same input</span>
          </div>
          <div className="demoReportViewport" tabIndex={0}>
            <div className="demoReport" ref={reportRef}>
              <AnalyticsReportPages />
            </div>
          </div>
        </div>

        <div className="demoEngines" aria-label="PDF generation options">
          <article className="demoEngineCard demoEngineRaster">
            <div className="demoEngineHeading">
              <h3>Screenshot PDF</h3>
            </div>
            <div className="demoEngineActions">
              <button
                className="button"
                disabled={isBusy}
                onClick={() => handleDownload("screenshot")}
                type="button"
              >
                <DownloadIcon />
                {busy === "screenshot-download" ? "Generating…" : "Download"}
              </button>
              <button
                className="demoPreviewButton"
                disabled={isBusy}
                onClick={(event) => handlePreview("screenshot", event.currentTarget)}
                type="button"
              >
                <PreviewIcon />
                {busy === "screenshot-preview" ? "Generating…" : "Preview"}
              </button>
            </div>
          </article>

          <article className="demoEngineCard demoEngineReal">
            <div className="demoEngineHeading">
              <h3>Real PDF</h3>
            </div>
            <div className="demoEngineActions">
              <button
                className="button buttonPrimary"
                disabled={isBusy}
                onClick={() => handleDownload("real")}
                type="button"
              >
                <DownloadIcon />
                {busy === "real-download" ? "Generating…" : "Download"}
              </button>
              <button
                className="demoPreviewButton demoPreviewButtonReal"
                disabled={isBusy}
                onClick={(event) => handlePreview("real", event.currentTarget)}
                type="button"
              >
                <PreviewIcon />
                {busy === "real-preview" ? "Generating…" : "Preview"}
              </button>
            </div>
          </article>

          {error ? <p className="demoError" role="alert">{error}</p> : null}
        </div>
      </div>

      {preview ? (
        <section
          className="demoPreview"
          aria-labelledby="demo-preview-title"
          ref={previewRef}
          tabIndex={-1}
        >
          <div className="demoPreviewHeader">
            <div className="demoPreviewHeading">
              <span>LIVE_PREVIEW.PDF</span>
              <strong id="demo-preview-title">
                {preview.engine === "real" ? "Real PDF preview" : "Screenshot PDF preview"}
              </strong>
            </div>
            <div className="demoPreviewActions">
              {preview.engine === "real" ? (
                <label className="demoToolbarToggle">
                  <input
                    checked={showRealToolbar}
                    onChange={(event) => setShowRealToolbar(event.currentTarget.checked)}
                    type="checkbox"
                  />
                  Show toolbar
                </label>
              ) : null}
              <button onClick={closePreview} type="button" aria-label="Close PDF preview">
                ×
              </button>
            </div>
          </div>
          <div
            className={`demoPreviewViewport${
              preview.engine === "real" ? " demoPreviewViewportNative" : ""
            }`}
          >
            {preview.engine === "real" ? (
              <div className="demoNativePreview" ref={realPreviewTargetRef} />
            ) : (
              preview.pages.map((page, index) => (
                <Image
                  alt={`Page ${index + 1} of ${preview.pageCount} in the generated PDF preview`}
                  className="demoPreviewPage"
                  height={page.height}
                  key={page.url}
                  src={page.url}
                  unoptimized
                  width={page.width}
                />
              ))
            )}
          </div>
          <div className="demoPreviewFooter">
            <span>{preview.pageCount} pages</span>
            <span>
              {preview.engine === "real"
                ? "Rendered by PdfDocument.preview()"
                : "Rendered from the screenshot PDF"}
            </span>
          </div>
        </section>
      ) : null}

      <div className="windowStatusbar demoStatusbar">
        <span>{isBusy ? "Rendering PDF…" : "Ready"}</span>
        <span>Runs locally in your browser</span>
      </div>
    </div>
  );
}
