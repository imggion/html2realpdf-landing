import type { PageOptions } from "@imggion/html2realpdf";

import generatedPlaygroundCatalog from "@/lib/generated/playground-examples.json";

export type PlaygroundCategory =
  | "all"
  | "documents"
  | "reports"
  | "presentations"
  | "small-formats"
  | "custom-sizes";

export type PlaygroundExample = {
  slug: string;
  title: string;
  format: string;
  orientation: "Portrait" | "Landscape";
  pageCount: number;
  fileSize: string;
  categories: Exclude<PlaygroundCategory, "all">[];
  pdfUrl: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  sourceUrl: string;
  filename: string;
};

export type PlaygroundSource = {
  html: string;
  css: string;
  page: PageOptions;
};

export type PlaygroundExamplePayload = PlaygroundExample & {
  source: PlaygroundSource;
};

export const playgroundCategories: Array<{
  id: PlaygroundCategory;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "documents", label: "Documents" },
  { id: "reports", label: "Reports" },
  { id: "presentations", label: "Presentations" },
  { id: "small-formats", label: "Small formats" },
  { id: "custom-sizes", label: "Custom sizes" },
];

export const playgroundExamples =
  generatedPlaygroundCatalog.examples as PlaygroundExample[];
