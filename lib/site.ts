const fallbackUrl = "https://html2realpdf.imggion.com";

export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackUrl,
);

export const siteConfig = {
  name: "html2realpdf",
  title: "html2realpdf — Selectable HTML to PDF in JavaScript",
  description:
    "Generate native, selectable, searchable PDFs from HTML in the browser with a TypeScript API powered by Zig and WebAssembly.",
  repository: "https://github.com/imggion/html2realpdf",
  npm: "https://www.npmjs.com/package/@imggion/html2realpdf",
  cssSupport:
    "https://github.com/imggion/html2realpdf/blob/main/docs/css-support.md",
  logo:
    "https://raw.githubusercontent.com/imggion/html2realpdf/main/docs/assets/html2realpdf-logo.webp",
} as const;
