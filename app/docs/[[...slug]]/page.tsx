import type { Metadata } from "next";
import type { AnchorHTMLAttributes } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findNeighbour } from "fumadocs-core/page-tree";
import { getMDXComponents } from "@/mdx-components";
import { docsSource } from "@/lib/docs-source";
import { DocsCopyMenu } from "../_components/docs-copy-menu";
import { DocsBreadcrumb, DocsTableOfContents } from "../_components/docs-page-nav";

type DocsPageProps = {
  params: Promise<{ slug?: string[] }>;
};

function resolveMdxHref(href: string | undefined, sourcePath: string) {
  if (!href?.startsWith(".")) return href;

  const pathname = new URL(href, `https://docs.local/${sourcePath}`).pathname
    .replace(/\.mdx$/, "")
    .replace(/\/index$/, "");

  return `/docs${pathname === "/" ? "" : pathname}`;
}

function createMdxLink(sourcePath: string) {
  return function MdxLink({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
    return <a href={resolveMdxHref(href, sourcePath)} {...props} />;
  };
}

export function generateStaticParams() {
  return docsSource.generateParams();
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = docsSource.getPage(slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: page.url },
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      url: page.url,
    },
  };
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug } = await params;
  const page = docsSource.getPage(slug);
  if (!page) notFound();

  const Mdx = page.data.body;
  const mdxComponents = getMDXComponents({ a: createMdxLink(page.path) });

  if (page.url === "/docs/playground") {
    return (
      <main className="docsPlaygroundPage" id="docs-content">
        <h1 className="srOnly">{page.data.title}</h1>
        <article className="docsProse docsProseGallery docsPlaygroundSurface">
          <Mdx components={mdxComponents} />
        </article>
      </main>
    );
  }

  const tree = docsSource.getPageTree();
  const neighbours = findNeighbour(tree, page.url);
  const markdown = await page.data.getText("processed");
  const isGallery = page.data.layout === "gallery";

  return (
    <main
      className={`docsContentGrid${isGallery ? " docsContentGridGallery" : ""}`}
      id="docs-content"
    >
      <div className="docsArticleColumn">
        <DocsBreadcrumb tree={tree} />
        <header className="docsPageHeader">
          <div className="docsPageMeta">
            {!isGallery ? (
              <DocsCopyMenu
                description={page.data.description}
                markdown={markdown}
                pageUrl={page.url}
                title={page.data.title}
              />
            ) : null}
          </div>
          <h1>{page.data.title}</h1>
          <p>{page.data.description}</p>
        </header>
        <DocsTableOfContents items={page.data.toc} />
        <article className={`docsProse${isGallery ? " docsProseGallery" : ""}`}>
          <Mdx components={mdxComponents} />
        </article>
        <nav aria-label="Documentation pages" className="docsPager">
          {neighbours.previous ? (
            <Link href={neighbours.previous.url} rel="prev">
              <span>PREVIOUS</span>
              <strong>← {neighbours.previous.name}</strong>
            </Link>
          ) : <span />}
          {neighbours.next ? (
            <Link href={neighbours.next.url} rel="next">
              <span>NEXT</span>
              <strong>{neighbours.next.name} →</strong>
            </Link>
          ) : null}
        </nav>
      </div>
      {!isGallery ? <DocsTableOfContents items={page.data.toc} /> : null}
    </main>
  );
}
