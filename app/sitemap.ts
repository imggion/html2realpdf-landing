import type { MetadataRoute } from "next";
import { docsSource } from "@/lib/docs-source";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const documentation = docsSource.getPages().map((page) => ({
    url: new URL(page.url, siteUrl).toString(),
    lastModified: new Date("2026-08-03"),
    changeFrequency: "weekly" as const,
    priority: page.url === "/docs" ? 0.9 : 0.7,
  }));

  return [
    {
      url: siteUrl.toString(),
      lastModified: new Date("2026-07-31"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/docs/llm.txt", siteUrl).toString(),
      lastModified: new Date("2026-08-03"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...documentation,
  ];
}
