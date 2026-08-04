import type { PlaygroundSource } from "@/lib/playground-examples";

function abortError() {
  return new DOMException("The playground render was cancelled.", "AbortError");
}

function composeDocument(html: string, css: string) {
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>${safeCss}</style>
</head>
<body>${html}</body>
</html>`;
}

function sanitizeHtml(html: string) {
  const inertDocument = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  inertDocument
    .querySelectorAll("base, embed, frame, iframe, link, meta, object, script")
    .forEach((element) => element.remove());

  for (const element of inertDocument.querySelectorAll("*")) {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith("on") || value.startsWith("javascript:")) {
        element.removeAttribute(attribute.name);
      }
    }
  }

  return inertDocument.body.innerHTML;
}

export function evaluatePlaygroundSource(
  source: PlaygroundSource,
  signal: AbortSignal,
): Promise<string> {
  if (signal.aborted) return Promise.reject(abortError());
  return Promise.resolve(composeDocument(sanitizeHtml(source.html), source.css));
}
