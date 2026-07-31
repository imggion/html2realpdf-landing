const fallbackUrl = "https://html2realpdf.imggion.com";

export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackUrl,
);

export const siteConfig = {
  name: "html2realpdf",
  title: "Client-Side HTML to PDF with Selectable Text | html2realpdf",
  description:
    "Generate selectable, searchable PDFs from HTML in the browser. Open-source TypeScript library powered by Zig/WebAssembly—no headless browser required.",
  version: "0.1.14",
  repository: "https://github.com/imggion/html2realpdf",
  npm: "https://www.npmjs.com/package/@imggion/html2realpdf",
  cssSupport:
    "https://github.com/imggion/html2realpdf/blob/main/docs/css-support.md",
  logo: "/android-chrome-192x192.png",
} as const;
