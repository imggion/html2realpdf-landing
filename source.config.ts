import { defineConfig, defineDocs, frontmatterSchema } from "fumadocs-mdx/config";
import { z } from "zod";

const docsFrontmatter = frontmatterSchema.extend({
  description: z.string().min(1),
  layout: z.enum(["article", "gallery"]).default("article"),
  apiSymbol: z.string().optional(),
  apiKind: z
    .enum(["function", "interface", "type-alias", "class", "enumeration"])
    .optional(),
});

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
    schema: docsFrontmatter,
  },
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      addLanguageClass: true,
      themes: {
        dark: "github-dark",
        light: "github-dark",
      },
    },
  },
});
