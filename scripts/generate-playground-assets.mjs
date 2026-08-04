import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

import {
  analyticsReportHtml,
  complexInvoiceHtml,
  presentationDeckHtml,
  roundedOperationsReportHtml,
} from "../vendor/html2realpdf/tests/web/pdf-fixtures.js";

const root = resolve(import.meta.dirname, "..");
const outputDir = resolve(root, "public/playground");
const assetRevision = "avely-v1";
const wasmPath = resolve(root, "node_modules/@imggion/html2realpdf/dist/libhtml2realpdf.wasm");
const wasm = await readFile(wasmPath);
const { instance } = await WebAssembly.instantiate(wasm, {});
const api = instance.exports;
const encoder = new TextEncoder();

const a4 = [595.2756, 841.8898];
const letter = [612, 792];
const a5 = [419.5276, 595.2756];
const a6 = [297.6378, 419.5276];

const fixtures = [
  fixture({
    slug: "receipt-80mm",
    title: "Cafe receipt",
    format: "80 mm",
    pageCount: 1,
    fileSize: "102 KB",
    categories: ["small-formats", "custom-sizes"],
    thumbnailAlt: "Narrow monochrome receipt from Avely.me",
    document: receiptHtml(),
    page: pageOptions([226.772, 566.929], 14),
  }),
  fixture({
    slug: "strategy-deck-16x9",
    title: "Strategy deck",
    format: "16:9",
    pageCount: 4,
    fileSize: "107 KB",
    categories: ["presentations", "custom-sizes"],
    thumbnailAlt: "Cover slide from a dark blue 16:9 strategy presentation",
    document: strategyDeckHtml(),
    page: pageOptions([960, 540], 0),
  }),
  fixture({
    slug: "complex-invoice",
    title: "Studio invoice",
    format: "A4",
    pageCount: 2,
    fileSize: "111 KB",
    categories: ["documents"],
    thumbnailAlt: "First page of a blue and white studio invoice",
    document: complexInvoiceHtml,
    page: pageOptions(a4, 36),
  }),
  fixture({
    slug: "analytics-report",
    title: "Analytics report",
    format: "A4",
    pageCount: 3,
    fileSize: "112 KB",
    categories: ["reports"],
    thumbnailAlt: "First page of the Avely.me analytics report",
    document: analyticsReportHtml,
    page: pageOptions(a4, 36),
  }),
  fixture({
    slug: "presentation-deck",
    title: "Product presentation",
    format: "A4",
    pageCount: 4,
    fileSize: "116 KB",
    categories: ["presentations"],
    thumbnailAlt: "Cover slide titled From operational data to confident decisions",
    document: presentationDeckHtml,
    page: pageOptions([a4[1], a4[0]], 36),
  }),
  fixture({
    slug: "rounded-operations",
    title: "Operations review",
    format: "A4",
    pageCount: 2,
    fileSize: "114 KB",
    categories: ["reports"],
    thumbnailAlt: "First page of a service delivery health report",
    document: roundedOperationsReportHtml,
    page: pageOptions(a4, 36),
  }),
  fixture({
    slug: "resume-letter",
    title: "Product designer resume",
    format: "Letter",
    pageCount: 1,
    fileSize: "106 KB",
    categories: ["documents"],
    thumbnailAlt: "One-page product designer resume for Maya Chen",
    document: resumeHtml(),
    page: pageOptions(letter, 34),
  }),
  fixture({
    slug: "product-brief-a5",
    title: "Product brochure",
    format: "A5",
    pageCount: 2,
    fileSize: "105 KB",
    categories: ["documents", "small-formats"],
    thumbnailAlt: "Warm beige cover of a compact notebook product brochure",
    document: productBriefHtml(),
    page: pageOptions(a5, 24),
  }),
  fixture({
    slug: "event-ticket",
    title: "Event ticket",
    format: "10 × 4 in",
    pageCount: 1,
    fileSize: "102 KB",
    categories: ["small-formats", "custom-sizes"],
    thumbnailAlt: "Wide white and magenta Avely.me event ticket",
    document: eventTicketHtml(),
    page: pageOptions([720, 288], 20),
  }),
  fixture({
    slug: "shipping-label-a6",
    title: "Shipping label",
    format: "A6",
    pageCount: 1,
    fileSize: "103 KB",
    categories: ["small-formats"],
    thumbnailAlt: "Black and white Avely.me shipping label",
    document: shippingLabelHtml(),
    page: pageOptions(a6, 14),
  }),
  fixture({
    slug: "certificate-landscape",
    title: "Course certificate",
    format: "Letter",
    pageCount: 1,
    fileSize: "101 KB",
    categories: ["documents", "custom-sizes"],
    thumbnailAlt: "Cream landscape certificate for the Document Systems Masterclass",
    document: certificateHtml(),
    page: pageOptions([letter[1], letter[0]], 28),
  }),
  fixture({
    slug: "multilingual-report",
    title: "Multilingual brief",
    format: "A4",
    pageCount: 1,
    fileSize: "105 KB",
    categories: ["documents", "reports"],
    thumbnailAlt: "Green and white multilingual international market brief",
    document: multilingualHtml(),
    page: pageOptions(a4, 36),
  }),
];

await mkdir(outputDir, { recursive: true });

const manifest = {
  generatedAt: new Date().toISOString(),
  assetRevision,
  engine: "html2realpdf vendored WASM fixture renderer",
  fixtures: {},
};
const generatedCatalog = {
  assetRevision,
  examples: [],
};

for (const sample of fixtures) {
  const input = encoder.encode(sample.html);
  const pointer = api.alloc(input.length);
  if (pointer === 0) throw new Error(`allocation failed for ${sample.name}`);

  let handle = 0;
  try {
    new Uint8Array(api.memory.buffer, pointer, input.length).set(input);
    const [formatWidth, formatHeight] = sample.source.page.format;
    const [width, height] = sample.source.page.orientation === "landscape"
      ? [formatHeight, formatWidth]
      : [formatWidth, formatHeight];
    const margin = sample.source.page.margin;
    handle = api.render_html_to_pdf_with_options(
      pointer,
      input.length,
      width,
      height,
      margin,
      margin,
      margin,
      margin,
    );
    if (handle === 0 || api.pdf_result_status(handle) !== 0) {
      const error = handle === 0
        ? "unknown renderer error"
        : new TextDecoder().decode(new Uint8Array(
            api.memory.buffer,
            api.pdf_result_error_ptr(handle),
            api.pdf_result_error_len(handle),
          ));
      throw new Error(`render failed for ${sample.name}: ${error}`);
    }

    const pageCount = api.pdf_result_page_count(handle);
    if (pageCount !== sample.catalog.pageCount) {
      throw new Error(
        `${sample.name} generated ${pageCount} pages; expected ${sample.catalog.pageCount}`,
      );
    }
    const data = new Uint8Array(
      api.memory.buffer,
      api.pdf_result_data_ptr(handle),
      api.pdf_result_data_len(handle),
    ).slice();
    const pdfPath = resolve(outputDir, `${sample.name}.pdf`);
    await writeFile(pdfPath, data);
    await run("pdftoppm", [
      "-f",
      "1",
      "-singlefile",
      "-png",
      "-r",
      "110",
      pdfPath,
      resolve(outputDir, `${sample.name}-page-1-${assetRevision}`),
    ]);
    await writeFile(
      resolve(outputDir, `${sample.name}.json`),
      `${JSON.stringify({
        ...sample.catalog,
        source: sample.source,
      }, null, 2)}\n`,
    );
    generatedCatalog.examples.push(sample.catalog);

    manifest.fixtures[sample.name] = {
      bytes: data.length,
      pages: pageCount,
      width,
      height,
      sha256: createHash("sha256").update(data).digest("hex"),
    };
  } finally {
    if (handle !== 0) api.pdf_result_free(handle);
    api.free(pointer, input.length);
  }
}

await writeFile(
  resolve(outputDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
await writeFile(
  resolve(root, "lib/generated/playground-examples.json"),
  `${JSON.stringify(generatedCatalog, null, 2)}\n`,
);

console.log(`Wrote ${fixtures.length} playground PDFs and thumbnails to ${outputDir}`);

function pageOptions(format, margin) {
  const orientation = format[0] > format[1] ? "landscape" : "portrait";

  return {
    format: orientation === "landscape" ? [format[1], format[0]] : format,
    orientation,
    unit: "pt",
    margin,
  };
}

function fixture(definition) {
  const brandedHtml = rebrandHtml(definition.document);
  const source = {
    ...splitDocumentSource(brandedHtml),
    page: definition.page,
  };
  const catalog = {
    slug: definition.slug,
    title: definition.title,
    format: definition.format,
    orientation: definition.page.orientation === "landscape" ? "Landscape" : "Portrait",
    pageCount: definition.pageCount,
    fileSize: definition.fileSize,
    categories: definition.categories,
    filename: `${definition.slug}.pdf`,
    pdfUrl: `/playground/${definition.slug}.pdf?v=${assetRevision}`,
    thumbnailUrl: `/playground/${definition.slug}-page-1-${assetRevision}.png`,
    thumbnailAlt: definition.thumbnailAlt,
    sourceUrl: `/playground/${definition.slug}.json?v=${assetRevision}`,
  };

  return {
    name: definition.slug,
    catalog,
    source,
    html: composeDocumentSource(source),
  };
}

function rebrandHtml(html) {
  return html
    .replaceAll("northstar.example", "avely.me")
    .replaceAll("NS-2026-041", "AV-2026-041")
    .replace(/NORTHSTAR (?:STUDIO|COMMERCE|OPERATIONS|SUMMIT|ANALYTICS|EXPRESS|CAFE)/g, "AVELY.ME")
    .replace(/Northstar (?:Studio|Commerce|Operations|Summit|Analytics|Express|Cafe)/g, "Avely.me")
    .replaceAll("NORTHSTAR", "AVELY.ME")
    .replaceAll("Northstar", "Avely.me");
}

function splitDocumentSource(documentSource) {
  const styles = [...documentSource.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean);
  const bodyMatch = documentSource.match(/<body(?:\s[^>]*)?>([\s\S]*?)<\/body>/i);
  const html = bodyMatch
    ? bodyMatch[1]
    : documentSource
        .replace(/<!doctype[^>]*>/gi, "")
        .replace(/<style(?:\s[^>]*)?>[\s\S]*?<\/style>/gi, "")
        .trim();

  return {
    html: formatHtmlSource(html),
    css: styles.join("\n\n"),
  };
}

function formatHtmlSource(html) {
  const blockTags = [
    "article",
    "div",
    "footer",
    "h1",
    "h2",
    "h3",
    "h4",
    "header",
    "li",
    "main",
    "ol",
    "p",
    "section",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
    "ul",
  ];
  const blockTagPattern = blockTags.join("|");
  const boundary = new RegExp(`>\\s*(?=<\\/?(?:${blockTagPattern})\\b)`, "gi");
  const opening = new RegExp(`<(?:${blockTagPattern})\\b[^>]*>`, "gi");
  const closing = new RegExp(`</(?:${blockTagPattern})\\s*>`, "gi");
  const startsWithClosing = new RegExp(`^</(?:${blockTagPattern})\\s*>`, "i");
  let depth = 0;

  return html
    .trim()
    .replace(boundary, ">\n")
    .replace(/(<([a-z][\w-]*)(?:\s[^>]*)?>)\n<\/\2>/gi, "$1</$2>")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const openingCount = line.match(opening)?.length ?? 0;
      const closingCount = line.match(closing)?.length ?? 0;
      const outputDepth = Math.max(0, depth - (startsWithClosing.test(line) ? 1 : 0));
      const formattedLine = `${"  ".repeat(outputDepth)}${line}`;
      depth = Math.max(0, depth + openingCount - closingCount);
      return formattedLine;
    })
    .join("\n");
}

function composeDocumentSource(source) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>${source.css}</style>
</head>
<body>${source.html}</body>
</html>`;
}

function documentHtml({ accent = "#f3a116", body, extraCss = "", title }) {
  return `
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; color: #122445; background: #ffffff; font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.45; }
      h1, h2, h3, p { margin-top: 0; }
      h1 { margin-bottom: 12pt; font-size: 27pt; line-height: 1.05; }
      h2 { margin-bottom: 8pt; font-size: 17pt; }
      h3 { margin-bottom: 5pt; font-size: 11pt; text-transform: uppercase; letter-spacing: 0.06em; }
      p { margin-bottom: 9pt; }
      .eyebrow { color: ${accent}; font-size: 8pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
      .muted { color: #5a6679; }
      .rule { height: 2pt; margin: 16pt 0; background: ${accent}; }
      .card { padding: 12pt; border: 1pt solid #d7dde7; background: #f7f9fc; }
      .page + .page { break-before: page; page-break-before: always; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 7pt; border-bottom: 1pt solid #d7dde7; text-align: left; vertical-align: top; }
      th { color: #5a6679; font-size: 8pt; letter-spacing: 0.05em; text-transform: uppercase; }
      ${extraCss}
    </style>
    <main aria-label="${title}">${body}</main>
  `;
}

function strategyDeckHtml() {
  return documentHtml({
    title: "Avely.me strategy presentation",
    accent: "#f3a116",
    extraCss: `
      body { background: #0d1d38; color: #fde9d3; }
      .slide { width: 960pt; height: 540pt; padding: 52pt 60pt; background: #0d1d38; }
      .slide + .slide { break-before: page; page-break-before: always; }
      .slide h1 { max-width: 650pt; font-size: 52pt; }
      .slide h1, .slide h2 { color: #fde9d3; }
      .slide h2 { font-size: 34pt; }
      .slide .muted { color: #aab6c8; }
      .slide-grid { width: 100%; margin-top: 34pt; border-collapse: separate; border-spacing: 12pt; }
      .slide-grid td { width: 33.333%; padding: 20pt; border: 1pt solid #35517a; background: #142b4e; color: #fde9d3; vertical-align: top; }
      .slide-grid h3, .slide-grid span { color: #fde9d3; }
      .metric strong { display: block; margin: 14pt 0 8pt; color: #f3a116; font-size: 34pt; }
      .bar { width: 100%; height: 44pt; margin-top: 22pt; border-collapse: collapse; }
      .bar td:nth-child(1) { width: 45%; background: #f3a116; }
      .bar td:nth-child(2) { width: 33%; background: #6c9bd4; }
      .bar td:nth-child(3) { width: 22%; background: #fde9d3; }
    `,
    body: `
      <section class="slide">
        <p class="eyebrow">Quarterly strategy review · 2026</p>
        <h1>Build the document layer teams trust.</h1>
        <div class="rule"></div>
        <p class="muted">Avely.me · Executive presentation</p>
      </section>
      <section class="slide">
        <p class="eyebrow">01 · Momentum</p>
        <h2>Growth is compounding across the core business.</h2>
        <table class="slide-grid"><tr>
          <td class="metric"><span>Revenue</span><strong>€4.82M</strong><p class="muted">+18.4% year over year</p></td>
          <td class="metric"><span>Customers</span><strong>28.6K</strong><p class="muted">+11.8% year over year</p></td>
          <td class="metric"><span>Margin</span><strong>64.2%</strong><p class="muted">+3.1 points</p></td>
        </tr></table>
      </section>
      <section class="slide">
        <p class="eyebrow">02 · Customer mix</p>
        <h2>Enterprise expansion leads the next stage.</h2>
        <table class="bar"><tr><td></td><td></td><td></td></tr></table>
        <table class="slide-grid"><tr>
          <td><h3>45% Enterprise</h3><p class="muted">Expansion revenue rose 28%.</p></td>
          <td><h3>33% Mid-market</h3><p class="muted">Retention remains above 96%.</p></td>
          <td><h3>22% SMB</h3><p class="muted">Self-serve activation improved.</p></td>
        </tr></table>
      </section>
      <section class="slide">
        <p class="eyebrow">03 · Next move</p>
        <h1>Ship one clear reporting system.</h1>
        <p class="muted">Standardize templates, preserve selectable content, and measure every exported document.</p>
      </section>
    `,
  });
}

function resumeHtml() {
  return documentHtml({
    title: "Product designer resume",
    accent: "#2356d8",
    extraCss: `
      .resume-header, .resume-layout, .work-grid { width: 100%; border-collapse: separate; }
      .resume-header { border-bottom: 2pt solid #2356d8; }
      .resume-header td { padding-bottom: 18pt; border: 0; vertical-align: top; }
      .resume-header td:last-child { width: 170pt; text-align: right; }
      .resume-layout { margin-top: 22pt; border-spacing: 14pt 0; }
      .resume-layout > tbody > tr > td { border: 0; vertical-align: top; }
      .resume-layout > tbody > tr > td:first-child { width: 150pt; }
      .work-grid { border-spacing: 8pt; }
      .work-grid td { width: 50%; padding: 12pt; border: 1pt solid #d7dde7; background: #f7f9fc; vertical-align: top; }
      .resume-item { margin-bottom: 18pt; }
      .resume-item strong { display: block; font-size: 12pt; }
      ul { padding-left: 16pt; }
    `,
    body: `
      <section class="page">
        <table class="resume-header"><tr><td><p class="eyebrow">Product designer</p><h1>Maya Chen</h1></td><td class="muted">London, UK<br/>maya@example.com<br/>maya.design</td></tr></table>
        <table class="resume-layout"><tr>
          <td><h3>Profile</h3><p>Design systems lead focused on clear, inclusive tools for complex workflows.</p><h3>Skills</h3><p class="muted">Product strategy<br/>Research<br/>Prototyping<br/>Design systems<br/>Accessibility</p></td>
          <td><h2>Experience</h2><article class="resume-item"><strong>Lead product designer · Avely.me</strong><span class="muted">2023–Present</span><ul><li>Led a reporting platform used by 28,000 customers.</li><li>Reduced document setup time by 42%.</li><li>Built an accessible component system across five teams.</li></ul></article><article class="resume-item"><strong>Senior product designer · Fieldwork</strong><span class="muted">2020–2023</span><ul><li>Designed collaborative planning tools for distributed teams.</li><li>Introduced continuous research and quarterly usability benchmarks.</li></ul></article><h2>Selected work</h2><table class="work-grid"><tr><td><h3>Report builder</h3><p>Flexible layouts with predictable PDF export.</p></td><td><h3>Design system</h3><p>Shared patterns for product and documentation.</p></td></tr></table></td>
        </tr></table>
      </section>
    `,
  });
}

function productBriefHtml() {
  return documentHtml({
    title: "Field notes product brochure",
    accent: "#d95f39",
    extraCss: `
      .cover { padding: 20pt; background: #f7e8dd; }
      .product-mark { display: inline-block; padding: 6pt 9pt; background: #122445; color: #fff; font-size: 8pt; font-weight: 700; }
      .feature { margin-bottom: 12pt; padding-bottom: 12pt; border-bottom: 1pt solid #d7b9a7; }
      .price { color: #d95f39; font-size: 28pt; font-weight: 700; }
    `,
    body: `
      <section class="page cover"><span class="product-mark">FIELD NOTES 02</span><p class="eyebrow" style="margin-top: 42pt">Limited field edition</p><h1>A smaller notebook for bigger observations.</h1><p class="muted">A compact A5 product brief with native type, color, and structured content.</p><div class="rule"></div><p class="price">€24</p></section>
      <section class="page" style="break-before:page;page-break-before:always"><p class="eyebrow">Made for daily work</p><h2>Simple materials. Useful details.</h2><article class="feature"><h3>Lay-flat binding</h3><p>Thread-sewn pages stay open while you sketch, plan, or take notes.</p></article><article class="feature"><h3>Recycled stock</h3><p>120 gsm warm-white paper balances opacity with a tactile finish.</p></article><article class="feature"><h3>Flexible grid</h3><p>A quiet 5 mm dot grid supports writing, diagrams, and quick calculations.</p></article><div class="card"><h3>Specifications</h3><p>A5 · 148 × 210 mm · 96 pages · FSC-certified paper</p></div></section>
    `,
  });
}

function eventTicketHtml() {
  return documentHtml({
    title: "Avely.me event ticket",
    accent: "#e751d2",
    extraCss: `
      body { background: #122445; color: #fff; }
      .ticket { width: 100%; min-height: 248pt; border: 2pt solid #e751d2; border-collapse: collapse; }
      .ticket td { border: 0; vertical-align: top; }
      .ticket-main { padding: 24pt; }
      .ticket-code { width: 150pt; padding: 18pt; border-left: 2pt dashed #e751d2 !important; background: #fff; color: #122445; text-align: center; }
      .qr { width: 90pt; height: 90pt; margin: 0 auto 10pt; border: 9pt double #122445; background: #122445; }
      .meta { width: 100%; margin-top: 22pt; }
      .meta td { width: 33.333%; color: #ffffff; }
    `,
    body: `<table class="ticket"><tr><td class="ticket-main"><p class="eyebrow">Avely.me 2026</p><h1>Designing for durable systems.</h1><table class="meta"><tr><td><strong>18 SEPT</strong><br/><span class="muted">09:30</span></td><td><strong>ROME</strong><br/><span class="muted">Auditorium 02</span></td><td><strong>SEAT</strong><br/><span class="muted">B-14</span></td></tr></table></td><td class="ticket-code"><div class="qr"></div><strong>AV26-B14</strong><br/><small>ADMIT ONE</small></td></tr></table>`,
  });
}

function shippingLabelHtml() {
  return documentHtml({
    title: "Shipping label",
    accent: "#122445",
    extraCss: `
      body { font-size: 9pt; }
      .label { border: 2pt solid #122445; }
      .label-row { padding: 10pt; border-bottom: 1pt solid #122445; }
      .label-grid { width: 100%; border-collapse: collapse; }
      .label-grid td { width: 50%; padding: 9pt; border-bottom: 1pt solid #122445; }
      .label-grid td:first-child { border-right: 1pt solid #122445; }
      .tracking { text-align: center; font-family: monospace; font-size: 12pt; letter-spacing: 0.08em; }
    `,
    body: `<section class="label"><div class="label-row"><strong>AVELY.ME</strong><br/><small>PRIORITY · TRACKED</small></div><div class="label-row"><small>SHIP TO</small><h2 style="margin-top:5pt">MAYA CHEN</h2><p>42 Example Street<br/>London EC1A 4HD<br/>United Kingdom</p></div><table class="label-grid"><tr><td><small>FROM</small><br/><strong>ROME HQ</strong></td><td><small>WEIGHT</small><br/><strong>1.24 KG</strong></td></tr><tr><td><small>SERVICE</small><br/><strong>AV-24</strong></td><td><small>ZONE</small><br/><strong>UK-04</strong></td></tr></table><p class="tracking">AV 2048 1170 42</p></section>`,
  });
}

function receiptHtml() {
  return documentHtml({
    title: "Cafe receipt",
    accent: "#122445",
    extraCss: `
      body { font-family: monospace; font-size: 8.5pt; }
      .receipt { text-align: center; }
      .receipt table { margin: 16pt 0; }
      .receipt th, .receipt td { padding: 5pt 0; border: 0; }
      .receipt th:last-child, .receipt td:last-child { text-align: right; }
      .dash { margin: 12pt 0; border-top: 1pt dashed #122445; }
      .total { font-size: 13pt; font-weight: 700; }
    `,
    body: `<section class="receipt"><h2>AVELY.ME</h2><p>Via Esempio 18 · Roma<br/>04/08/2026 · 10:42<br/>ORDER #2048</p><div class="dash"></div><table><thead><tr><th>ITEM</th><th>EUR</th></tr></thead><tbody><tr><td>2 × Espresso</td><td>4.40</td></tr><tr><td>Cornetto</td><td>2.20</td></tr><tr><td>Still water</td><td>1.50</td></tr></tbody></table><div class="dash"></div><p class="total">TOTAL EUR 8.10</p><p>VISA ·•••• 4242<br/>AUTH 892140</p><div class="dash"></div><p>Thank you.<br/>avely.me</p></section>`,
  });
}

function certificateHtml() {
  return documentHtml({
    title: "Course completion certificate",
    accent: "#c28b2c",
    extraCss: `
      body { background: #f8f2df; }
      .certificate { min-height: 556pt; padding: 58pt; border: 6pt double #c28b2c; text-align: center; }
      .certificate h1 { margin: 34pt auto 18pt; font-family: Georgia, serif; font-size: 42pt; }
      .certificate .name { margin: 22pt 0; color: #8a5d10; font-family: Georgia, serif; font-size: 30pt; }
      .signatures { width: 70%; margin: 54pt auto 0; border-collapse: separate; border-spacing: 34pt 0; }
      .signature { width: 50%; padding-top: 8pt; border-top: 1pt solid #122445; text-align: center; }
    `,
    body: `<section class="certificate"><p class="eyebrow">Certificate of completion</p><h1>Document Systems Masterclass</h1><p>This certifies that</p><p class="name">Maya Chen</p><p>successfully completed the advanced programme in reliable document design and PDF production.</p><table class="signatures"><tr><td class="signature">Programme director</td><td class="signature">4 August 2026</td></tr></table></section>`,
  });
}

function multilingualHtml() {
  return documentHtml({
    title: "Multilingual market report",
    accent: "#16865c",
    extraCss: `
      .language { margin-bottom: 14pt; padding: 12pt; border-left: 4pt solid #16865c; background: #f3faf7; }
      .language strong { display: block; margin-bottom: 4pt; }
      .numbers { width: 100%; margin: 18pt 0; border-collapse: separate; border-spacing: 8pt; }
      .numbers td { width: 33.333%; padding: 12pt; border: 1pt solid #d7dde7; background: #f7f9fc; }
      .numbers strong { display: block; color: #16865c; font-size: 22pt; }
    `,
    body: `<section><p class="eyebrow">International market brief</p><h1>One report, four markets.</h1><p class="muted">A multilingual layout demonstrating Unicode text, repeated structure, and regional figures.</p><table class="numbers"><tr><td><span>Markets</span><strong>04</strong></td><td><span>Revenue</span><strong>€8.4M</strong></td><td><span>Growth</span><strong>+17%</strong></td></tr></table><article class="language"><strong>Italiano</strong><p>La crescita è sostenuta dalla domanda enterprise e da una maggiore fidelizzazione.</p></article><article class="language"><strong>Français</strong><p>La croissance repose sur les comptes stratégiques et une meilleure fidélisation.</p></article><article class="language"><strong>Deutsch</strong><p>Das Wachstum wird durch Unternehmenskunden und eine stärkere Bindung getragen.</p></article><article class="language"><strong>English</strong><p>Growth is driven by enterprise demand and stronger customer retention.</p></article></section>`,
  });
}

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0
      ? resolvePromise()
      : reject(new Error(`${basename(command)} exited with ${code} while writing ${dirname(args.at(-1))}`)));
  });
}
