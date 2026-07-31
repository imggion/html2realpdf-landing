import Image from "next/image";
import { codeToHtml } from "shiki";
import { CopyCommandButton } from "@/app/_components/copy-command-button";
import { PdfComparisonDemo } from "@/app/_components/pdf-comparison-demo";
import { WindowDownloadButton } from "@/app/_components/window-download-button";
import { getRepositoryStars } from "@/lib/github";
import { siteConfig, siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const comparisonRows = [
  {
    feature: "Text model",
    screenshot: "One bitmap per page",
    real: "Native PDF text",
  },
  {
    feature: "Select & copy",
    screenshot: "Not available",
    real: "Yes",
  },
  {
    feature: "Search",
    screenshot: "Needs OCR",
    real: "Built in",
  },
  {
    feature: "Links",
    screenshot: "Visual only",
    real: "PDF annotations",
  },
  {
    feature: "Supported graphics",
    screenshot: "Rasterized",
    real: "Native vectors",
  },
  {
    feature: "Zoom",
    screenshot: "Pixels get softer",
    real: "Text stays sharp",
  },
] as const;

const useCases = [
  ["01", "Invoices", "Selectable totals, searchable line items, and clickable payment links."],
  ["02", "Reports", "Native text, vector charts, tables, headers, footers, and page numbers."],
  ["03", "Tickets", "Compact browser-generated PDFs with copyable references and live links."],
  ["04", "Letters", "Embedded font subsets and predictable A4 or Letter page geometry."],
  ["05", "Slides", "Landscape pages with vector graphics that stay crisp at every zoom level."],
  ["06", "Documents", "HTML strings, DOM elements, React refs, and Vue template refs."],
] as const;

const faqs = [
  {
    question: "What makes html2realpdf different from html2pdf.js?",
    answer:
      "html2pdf.js captures HTML through html2canvas and places the resulting image into a PDF. html2realpdf writes native PDF text, link annotations, embedded font subsets, and supported vector graphics instead of turning the whole page into a screenshot.",
  },
  {
    question: "Does HTML-to-PDF generation happen in the browser?",
    answer:
      "Yes. The Zig renderer is compiled to WebAssembly and runs client-side in modern browsers. Your application can generate and download the PDF without sending document content to a conversion server.",
  },
  {
    question: "Can I use it with React or Vue?",
    answer:
      "Yes. html2realpdf works at the DOM boundary. Pass a mounted DOM element, a React-shaped ref, a Vue template ref value, or an HTML string to the renderer.",
  },
  {
    question: "Is there a migration path from html2pdf.js?",
    answer:
      "Yes. The default export provides an html2pdf.js-style chain with familiar methods such as from(), set(), save(), output(), and toPdf(). Raster-only stages such as html2canvas, image output, and whole-page canvas output fail explicitly.",
  },
  {
    question: "Which CSS features are supported?",
    answer:
      "The versioned CSS profiles cover document layout, pagination, tables, Flexbox, Grid, positioned layout, backgrounds, shadows, transforms, and supported SVG. The public CSS support matrix is the source of truth for exact coverage and current limits.",
  },
  {
    question: "Does it claim full PDF/UA compliance?",
    answer:
      "No. The current release provides machine-readable text and accessible preview controls, but it does not claim PDF/UA or fully tagged PDF compliance.",
  },
] as const;

const installCommand = "npm install @imggion/html2realpdf";

const quickStartCode = `import { renderPdf } from "@imggion/html2realpdf";

const invoice = document.querySelector("#invoice");
if (!invoice) {
  throw new Error("Invoice not found");
}

const pdf = await renderPdf(invoice);
try {
  pdf.download("invoice.pdf");
} finally {
  pdf.dispose();
}`;

const compatibilityCode = `import html2pdf from "@imggion/html2realpdf";

html2pdf()
  .from(document.querySelector("#report"))
  .save("report.pdf");`;

const highlightedCodePromise = Promise.all([
  codeToHtml(quickStartCode, { lang: "typescript", theme: "kanagawa-wave" }),
  codeToHtml(compatibilityCode, { lang: "typescript", theme: "kanagawa-wave" }),
]);

const softwareStructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "html2realpdf",
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: "HTML to PDF JavaScript library",
  operatingSystem: "Modern web browsers",
  description: siteConfig.description,
  url: siteUrl.toString(),
  codeRepository: siteConfig.repository,
  downloadUrl: siteConfig.npm,
  softwareVersion: "0.1.1",
  programmingLanguage: ["TypeScript", "Zig", "WebAssembly"],
  license: "https://opensource.org/license/mit",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h11M11 5l5 5-5 5" />
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

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="m10 1.9 2.5 5.06 5.58.81-4.04 3.94.95 5.56L10 14.65l-4.99 2.62.95-5.56-4.04-3.94 5.58-.81L10 1.9Z" />
    </svg>
  );
}

function WindowActions({ filename, title }: { filename: string; title: string }) {
  return (
    <span className="windowActions">
      <WindowDownloadButton filename={filename} windowTitle={title} />
      <span className="windowControls" aria-hidden="true">
        <i>_</i>
        <i>□</i>
        <i>×</i>
      </span>
    </span>
  );
}

export default async function Home() {
  const [[quickStartHtml, compatibilityHtml], repositoryStars] = await Promise.all([
    highlightedCodePromise,
    getRepositoryStars(),
  ]);
  const formattedStars = repositoryStars?.toLocaleString("en-US") ?? null;
  const currentYear = new Date().getFullYear();

  return (
    <>
      <a className="skipLink" href="#main-content">
        Skip to content
      </a>

      <header className="siteHeader">
        <div className="navShell">
          <a className="brand" href="#top" aria-label="html2realpdf home">
            <Image
              alt=""
              className="brandLogo"
              height={52}
              preload
              sizes="52px"
              src={siteConfig.logo}
              width={52}
            />
            <span>
              <strong>html2realpdf</strong>
              <small>Browser PDF engine</small>
            </span>
          </a>

          <nav className="primaryNav" aria-label="Primary navigation">
            <a href="#why-real">Why real PDF</a>
            <a href="#compare">Compare</a>
            <a href="#quick-start">Quick start</a>
            <a href="#faq">FAQ</a>
          </nav>

          <a
            aria-label={
              repositoryStars === null
                ? "GitHub repository"
                : `GitHub repository, ${repositoryStars} stars`
            }
            className="button buttonCompact githubButton"
            href={siteConfig.repository}
            rel="noreferrer"
            target="_blank"
          >
            <GitHubIcon />
            <span className="githubLabel">GitHub</span>
            {formattedStars ? (
              <span aria-hidden="true" className="githubStars">
                <StarIcon />
                {formattedStars}
              </span>
            ) : null}
          </a>
        </div>
      </header>

      <main id="main-content">
        <section className="hero section" id="top" aria-labelledby="hero-title">
          <div className="heroCopy">
            <h1 id="hero-title">
              HTML to PDF.
              <span>A real PDF.</span>
            </h1>
            <p className="heroLead">
              Generate native, selectable, searchable PDFs from HTML in the browser.
              Powered by Zig, WebAssembly, and a typed TypeScript API—not a screenshot
              pipeline.
            </p>

            <div className="heroActions">
              <a
                className="button buttonPrimary"
                href={siteConfig.npm}
                rel="noreferrer"
                target="_blank"
              >
                Install from npm
                <ArrowIcon />
              </a>
              <a
                className="button"
                href={siteConfig.repository}
                rel="noreferrer"
                target="_blank"
              >
                Read the docs
              </a>
            </div>

            <div className="installLine" aria-label={`Install command: ${installCommand}`}>
              <div className="installCommandText">
                <span aria-hidden="true">~/project $</span>
                <code>{installCommand}</code>
              </div>
              <CopyCommandButton command={installCommand} />
            </div>
          </div>

          <div
            className="heroWindow window"
            aria-label="Native PDF output preview"
          >
            <div className="windowTitlebar">
              <span>OUTPUT_PREVIEW.PDF</span>
              <span className="windowControls" aria-hidden="true">
                <i>_</i>
                <i>□</i>
                <i>×</i>
              </span>
            </div>
            <div className="windowToolbar" aria-hidden="true">
              <span>File</span>
              <span>View</span>
              <span>Page</span>
              <b>125%</b>
            </div>
            <div className="previewStage">
              <article className="pdfPage">
                <div className="pdfHeader">
                  <span>ACME.STUDIO</span>
                  <b>INVOICE</b>
                </div>
                <div className="pdfRule" />
                <p className="pdfKicker">Invoice #0042 · Jul 15, 2026</p>
                <h2>Design systems<br />that ship.</h2>
                <p className="selectableText">
                  <span>Selectable text.</span> Search it, copy it, feed it to your tools.
                  No OCR required.
                </p>
                <div className="invoiceRows">
                  <span>Design engineering</span><b>$4,800</b>
                  <span>PDF implementation</span><b>$2,400</b>
                </div>
                <div className="pdfTotal"><span>Total</span><b>$7,200</b></div>
                <a href="#quick-start">pay.acme.example/inv-0042</a>
              </article>
            </div>
            <div className="windowStatusbar">
              <span>Page 1 of 1</span>
              <span>Text layer: native</span>
            </div>
          </div>
        </section>

        <aside className="techStrip" aria-label="Technology and license">
          <span>TYPE: OPEN SOURCE LIBRARY</span>
          <span>ZIG</span>
          <span>WEBASSEMBLY</span>
          <span>TYPESCRIPT</span>
          <span>LICENSE: MIT</span>
        </aside>

        <section className="section demoSection" id="live-demo" aria-labelledby="demo-title">
          <div className="sectionIntro demoIntro">
            <h2 id="demo-title">Try the difference yourself.</h2>
            <p>
              One three-page analytics report, two PDF engines. Download both files or
              preview every page here, then test the text, tables, and vector charts.
            </p>
          </div>
          <PdfComparisonDemo />
        </section>

        <section className="section realPdfSection" id="why-real" aria-labelledby="why-title">
          <div className="sectionIntro">
            <h2 id="why-title">A PDF should be a document, not a picture of one.</h2>
            <p>
              Canvas-based HTML-to-PDF tools flatten the page into pixels. html2realpdf
              preserves the parts that make PDF useful: text, links, fonts, layout, and
              supported vector graphics.
            </p>
          </div>

          <div className="modelGrid">
            <article className="modelCard modelCardMuted">
              <div className="modelTitlebar">
                <span>SCREENSHOT_PDF.JPG</span>
                <span>×</span>
              </div>
              <div className="modelBody">
                <span className="modelLabel">RASTER PIPELINE</span>
                <div className="rasterSample" aria-hidden="true">
                  <span>TEXT BECOMES PIXELS</span>
                </div>
                <h3>Looks like text.</h3>
                <p>
                  But the page is a large image. Selection, search, copy, and machine
                  reading need extra work.
                </p>
              </div>
            </article>

            <div className="modelArrow" aria-hidden="true">→</div>

            <article className="modelCard modelCardReal">
              <div className="modelTitlebar">
                <span>REAL_DOCUMENT.PDF</span>
                <span>✓</span>
              </div>
              <div className="modelBody">
                <span className="modelLabel">NATIVE PDF PIPELINE</span>
                <div className="textSample">TEXT STAYS SELECTABLE</div>
                <h3>Works like text.</h3>
                <p>
                  Unicode mappings keep content searchable and copyable. Supported
                  graphics remain vectors.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section className="section comparisonSection" id="compare" aria-labelledby="compare-title">
          <div className="sectionIntro sectionIntroSplit">
            <div>
              <h2 id="compare-title">Native PDF vs. screenshot PDF</h2>
            </div>
            <p>
              The visual difference can be subtle at 100%. The document-model difference
              is not.
            </p>
          </div>

          <div className="comparisonWindow window" data-downloadable-window>
            <div className="windowTitlebar">
              <span>OUTPUT_PROPERTIES</span>
              <WindowActions filename="output-properties-card.pdf" title="Output properties" />
            </div>
            <div className="comparisonTable" role="table" aria-label="PDF output comparison">
              <div className="comparisonRow comparisonHead" role="row">
                <span role="columnheader">Capability</span>
                <span role="columnheader">Screenshot PDF</span>
                <span role="columnheader">html2realpdf</span>
              </div>
              {comparisonRows.map((row) => (
                <div className="comparisonRow" role="row" key={row.feature}>
                  <strong role="cell">{row.feature}</strong>
                  <span className="negativeCell" role="cell">{row.screenshot}</span>
                  <span className="positiveCell" role="cell">
                    <CheckIcon /> {row.real}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section benchmarkSection" aria-labelledby="benchmark-title">
          <div className="benchmarkCopy">
            <h2 id="benchmark-title">Optimized for everything</h2>
            <p>
              In one deterministic 30-page stress-report run, html2realpdf produced a
              smaller native PDF and completed faster than html2pdf.js.
            </p>
            <a className="textLink" href={`${siteConfig.repository}#benchmark`} rel="noreferrer" target="_blank">
              See benchmark details <ArrowIcon />
            </a>
          </div>
          <div className="benchmarkStats">
            <article>
              <b>33.1%</b>
              <span>faster first PDF</span>
            </article>
            <article>
              <b>34.5%</b>
              <span>faster warm render</span>
            </article>
            <article>
              <b>85.8%</b>
              <span>smaller file</span>
            </article>
          </div>
          <p className="benchmarkNote">
            Recorded project benchmark, not a universal performance guarantee. Results
            vary with content, browser, and hardware.
          </p>
        </section>

        <section className="section quickStartSection" id="quick-start" aria-labelledby="quick-title">
          <div className="quickStartCopy">
            <h2 id="quick-title">One element in. One real PDF out.</h2>
            <p>
              Install the package, pass an HTML string or mounted DOM element, then
              download the result. Release the document when you are done.
            </p>
            <ol className="stepList">
              <li><span>1</span><div><strong>Install</strong><p>Use npm, pnpm, Yarn, or Bun.</p></div></li>
              <li><span>2</span><div><strong>Render</strong><p>Pass HTML, an element, or a framework ref.</p></div></li>
              <li><span>3</span><div><strong>Download</strong><p>Save, preview, or get the PDF bytes.</p></div></li>
            </ol>
          </div>

          <div className="codeStack">
            <div className="codeWindow window" data-downloadable-window>
              <div className="windowTitlebar">
                <span>QUICK_START.TS</span>
                <WindowActions filename="quick-start-card.pdf" title="Quick start" />
              </div>
              <div
                className="codeHighlight"
                dangerouslySetInnerHTML={{ __html: quickStartHtml }}
              />
            </div>
            <div className="codeWindow codeWindowSecondary window" data-downloadable-window>
              <div className="windowTitlebar">
                <span>HTML2PDF_COMPAT.TS</span>
                <WindowActions filename="html2pdf-compat-card.pdf" title="html2pdf compatibility" />
              </div>
              <div
                className="codeHighlight"
                dangerouslySetInnerHTML={{ __html: compatibilityHtml }}
              />
            </div>
          </div>
        </section>

        <section className="section useCasesSection" aria-labelledby="uses-title">
          <div className="sectionIntro sectionIntroSplit">
            <div>
              <h2 id="uses-title">Use the HTML you already have.</h2>
            </div>
            <p>
              A browser-first HTML-to-PDF library for the documents web applications
              generate every day.
            </p>
          </div>
          <div className="useCaseGrid">
            {useCases.map(([index, title, description]) => (
              <article key={title}>
                <span>{index}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section architectureSection" aria-labelledby="architecture-title">
          <div className="architectureWindow window" data-downloadable-window>
            <div className="windowTitlebar">
              <span>RENDER_PIPELINE.SYS</span>
              <WindowActions filename="render-pipeline-card.pdf" title="Render pipeline" />
            </div>
            <div className="pipeline">
              <div><span>INPUT</span><strong>HTML + CSS</strong><small>string · element · ref</small></div>
              <b aria-hidden="true">→</b>
              <div><span>ENGINE</span><strong>Zig + WASM</strong><small>layout · paginate · write</small></div>
              <b aria-hidden="true">→</b>
              <div><span>OUTPUT</span><strong>Native PDF</strong><small>text · links · vectors</small></div>
            </div>
          </div>
          <div className="architectureCopy">
            <h2 id="architecture-title">Browser-first, framework-agnostic.</h2>
            <p>
              TypeScript handles the DOM boundary and API. WebAssembly runs the Zig
              layout and PDF writer. The result stays portable across plain JavaScript,
              React, Vue, and other browser frameworks.
            </p>
            <a className="textLink" href={siteConfig.cssSupport} rel="noreferrer" target="_blank">
              Explore the CSS support matrix <ArrowIcon />
            </a>
          </div>
        </section>

        <section className="section faqSection" id="faq" aria-labelledby="faq-title">
          <div className="sectionIntro sectionIntroSplit">
            <div>
              <h2 id="faq-title">Questions, answered plainly.</h2>
            </div>
            <p>Technical claims on this page follow the current repository and public support matrix.</p>
          </div>
          <div className="faqList">
            {faqs.map((faq, index) => (
              <details key={faq.question} open={index === 0}>
                <summary>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {faq.question}
                  <i aria-hidden="true">+</i>
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="section finalCta" aria-labelledby="cta-title">
          <div>
            <h2 id="cta-title">Stop shipping screenshots as documents.</h2>
            <p>Open source. MIT licensed. Available on npm.</p>
          </div>
          <div className="finalActions">
            <a className="button buttonPrimary" href={siteConfig.npm} rel="noreferrer" target="_blank">
              Install html2realpdf <ArrowIcon />
            </a>
            <a className="button" href={siteConfig.repository} rel="noreferrer" target="_blank">
              View on GitHub
            </a>
          </div>
        </section>
      </main>

      <footer className="siteFooter">
        <a className="footerBrand" href="#top">
          <Image alt="html2realpdf" height={44} sizes="44px" src={siteConfig.logo} width={44} />
          <strong>html2realpdf</strong>
        </a>
        <div className="footerMeta">
          <p>A real PDF, not a screenshot.</p>
          <p>© {currentYear} Imggion</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href={siteConfig.repository} rel="noreferrer" target="_blank">GitHub</a>
          <a href={siteConfig.npm} rel="noreferrer" target="_blank">npm</a>
          <a href={siteConfig.cssSupport} rel="noreferrer" target="_blank">CSS support</a>
          <a href={`${siteConfig.repository}/blob/main/LICENSE.md`} rel="noreferrer" target="_blank">MIT License</a>
        </nav>
      </footer>

      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareStructuredData).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
    </>
  );
}
