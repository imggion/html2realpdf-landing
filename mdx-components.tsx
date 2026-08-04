import type { MDXComponents } from "mdx/types";
import { docsMdxComponents } from "@/app/_components/docs-mdx";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...docsMdxComponents,
    ...components,
  };
}

export const useMDXComponents = getMDXComponents;
