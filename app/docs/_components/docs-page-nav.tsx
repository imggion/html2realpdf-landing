"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as PageTree from "fumadocs-core/page-tree";
import { useBreadcrumb } from "fumadocs-core/breadcrumb";
import {
  AnchorProvider,
  ScrollProvider,
  TOCItem,
  type TOCItemType,
} from "fumadocs-core/toc";
import { Fragment, useRef } from "react";

export function DocsBreadcrumb({ tree }: { tree: PageTree.Root }) {
  const pathname = usePathname();
  const items = useBreadcrumb(pathname, tree);

  return (
    <nav aria-label="Breadcrumb" className="docsBreadcrumb">
      <ol>
        <li><Link href="/docs">DOCS</Link></li>
        {items.map((item, index) => (
          <Fragment key={`${item.url ?? "item"}-${index}`}>
            <li aria-hidden="true">/</li>
            <li>
              {item.url && index < items.length - 1 ? (
                <Link href={item.url}>{item.name}</Link>
              ) : (
                <span aria-current="page">{item.name}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

function TocLinks({ items }: { items: TOCItemType[] }) {
  const listRef = useRef<HTMLOListElement>(null);

  return (
    <AnchorProvider toc={items}>
      <ScrollProvider containerRef={listRef}>
        <ol ref={listRef}>
          {items.map((item) => (
            <li key={item.url} style={{ paddingInlineStart: `${Math.max(item.depth - 2, 0) * 12}px` }}>
              <TOCItem href={item.url}>{item.title}</TOCItem>
            </li>
          ))}
        </ol>
      </ScrollProvider>
    </AnchorProvider>
  );
}

export function DocsTableOfContents({ items }: { items: TOCItemType[] }) {
  if (items.length === 0) return null;

  return (
    <>
      <details className="docsMobileToc">
        <summary>ON_THIS_PAGE</summary>
        <TocLinks items={items} />
      </details>
      <aside className="docsToc">
        <p>ON_THIS_PAGE</p>
        <TocLinks items={items} />
      </aside>
    </>
  );
}
