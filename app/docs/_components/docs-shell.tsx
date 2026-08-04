"use client";

import { Command } from "cmdk";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type * as PageTree from "fumadocs-core/page-tree";
import { useDocsSearch } from "fumadocs-core/search/client";
import { fetchClient } from "fumadocs-core/search/client/fetch";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { siteConfig } from "@/lib/site";

const searchClient = fetchClient({ api: "/api/search" });

function containsPath(node: PageTree.Node, pathname: string): boolean {
  if (node.type === "page") return node.url === pathname;
  if (node.type === "folder") {
    return node.index?.url === pathname || node.children.some((child) => containsPath(child, pathname));
  }
  return false;
}

function SidebarNode({ node, pathname }: { node: PageTree.Node; pathname: string }) {
  if (node.type === "separator") {
    return <li className="docsSidebarSeparator">{node.name}</li>;
  }

  if (node.type === "page") {
    const active = node.url === pathname;
    const content = (
      <>
        <span aria-hidden="true">›</span>
        {node.name}
      </>
    );
    return (
      <li>
        {node.url.endsWith(".txt") ? (
          <a aria-current={active ? "page" : undefined} href={node.url}>{content}</a>
        ) : (
          <Link aria-current={active ? "page" : undefined} href={node.url}>{content}</Link>
        )}
      </li>
    );
  }

  const active = containsPath(node, pathname);
  return (
    <li className="docsSidebarFolder">
      <details open={active || node.defaultOpen ? true : undefined}>
        <summary>{node.name}</summary>
        <ul>
          {node.index ? (
            <SidebarNode node={node.index} pathname={pathname} />
          ) : null}
          {node.children.map((child, index) => (
            <SidebarNode
              key={child.$id ?? `${node.$id ?? "folder"}-${index}`}
              node={child}
              pathname={pathname}
            />
          ))}
        </ul>
      </details>
    </li>
  );
}

function DocsSidebar({ tree }: { tree: PageTree.Root }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation" className="docsSidebarNav" key={pathname}>
      <p>FILE_EXPLORER</p>
      <ul>
        {tree.children.map((node, index) => (
          <SidebarNode
            key={node.$id ?? `root-${index}`}
            node={node}
            pathname={pathname}
          />
        ))}
      </ul>
    </nav>
  );
}

function plainResult(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/[*_`#[\]]/g, "")
    .trim();
}

function SearchResultType({ type }: { type: string }) {
  const label = type === "page" ? "Page" : type === "heading" ? "Heading" : "Text";

  return (
    <span className="docsSearchResultType" data-type={type}>
      <span aria-hidden="true" className="docsSearchResultIcon">
        {type === "page" ? (
          <svg fill="none" viewBox="0 0 16 16">
            <path d="M3.75 2.25h5.5l3 3v8.5h-8.5z" />
            <path d="M9.25 2.25v3h3M6 8h4M6 10.5h4" />
          </svg>
        ) : type === "heading" ? "#" : "{}"}
      </span>
      {label}
    </span>
  );
}

function DocsSearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  const pointerSelectionRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { search, setSearch, query } = useDocsSearch({ client: searchClient });
  const results = query.data === "empty" || query.data === undefined ? [] : query.data;

  function openSearch() {
    setOpen(true);
  }

  function closeSearch() {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setOpen(true);
      return;
    }

    closeSearch();
  }

  function handleResultSelect(url: string) {
    if (pointerSelectionRef.current) {
      pointerSelectionRef.current = false;
      return;
    }

    closeSearch();
    router.push(url);
  }

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((currentOpen) => {
          if (currentOpen) {
            window.requestAnimationFrame(() => triggerRef.current?.focus());
          }

          return !currentOpen;
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="docsSearchTrigger"
        onClick={openSearch}
        ref={triggerRef}
        type="button"
      >
        <span aria-hidden="true">⌕</span>
        Search
        <kbd>⌘K</kbd>
      </button>
      <Command.Dialog
        className="docsSearchCommand"
        contentClassName="docsCommandDialog"
        label="Search guides and API symbols"
        loop
        onOpenChange={handleOpenChange}
        open={open}
        overlayClassName="docsCommandOverlay"
        shouldFilter={false}
      >
        <div className="docsDialogTitlebar">
          <strong>SEARCH_DOCUMENTATION</strong>
          <button aria-label="Close search" onClick={closeSearch} type="button">
            ×
          </button>
        </div>
        <div className="docsSearchForm">
          <label>
            <span>Search guides and API symbols</span>
            <Command.Input
              aria-describedby="docs-search-status"
              onValueChange={setSearch}
              placeholder="Try renderPdf or page margins"
              ref={inputRef}
              value={search}
            />
          </label>
        </div>
        <div
          aria-live="polite"
          className="docsSearchStatus"
          id="docs-search-status"
          role="status"
        >
          {query.isLoading
            ? "Searching..."
            : search && results.length === 0
              ? "No matching documentation found."
              : search
                ? `${results.length} result${results.length === 1 ? "" : "s"}`
                : "Enter a title, heading, option, or API symbol."}
        </div>
        <Command.List
          aria-busy={query.isLoading}
          className="docsSearchResults"
          label="Documentation search results"
        >
          {query.isLoading ? (
            <Command.Loading className="docsSearchMessage" label="Searching documentation">
              Searching documentation...
            </Command.Loading>
          ) : results.length > 0 ? (
            results.map((result, index) => (
              <Command.Item
                asChild
                key={`${result.id}-${index}`}
                onSelect={() => handleResultSelect(result.url)}
                value={`${result.id}-${index}`}
              >
                <Link
                  className="docsSearchResult"
                  href={result.url}
                  onClick={() => {
                    pointerSelectionRef.current = true;
                    closeSearch();
                  }}
                  tabIndex={-1}
                >
                  <SearchResultType type={result.type} />
                  <span className="docsSearchResultContent">
                    <strong>{plainResult(result.content)}</strong>
                    {result.breadcrumbs?.length ? (
                      <small>{result.breadcrumbs.map(plainResult).join(" / ")}</small>
                    ) : null}
                  </span>
                </Link>
              </Command.Item>
            ))
          ) : (
            <Command.Empty className="docsSearchMessage">
              {search
                ? "No matching documentation found."
                : "Enter a title, heading, option, or API symbol."}
            </Command.Empty>
          )}
        </Command.List>
      </Command.Dialog>
    </>
  );
}

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <rect height="15" rx="1" width="16" x="2" y="2.5" />
      <path d="M7 3v14" />
      <path d={collapsed ? "m11 7 3 3-3 3" : "m14 7-3 3 3 3"} />
    </svg>
  );
}

export function DocsShell({ children, tree }: { children: ReactNode; tree: PageTree.Root }) {
  const mobileDialogRef = useRef<HTMLDialogElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileTitleId = useId();
  const pathname = usePathname();
  const [sidebarOverride, setSidebarOverride] = useState<boolean | null>(null);
  const isPlayground = pathname === "/docs/playground";
  const sidebarCollapsed = sidebarOverride ?? isPlayground;

  useEffect(() => {
    mobileDialogRef.current?.close();
  }, [pathname]);

  return (
    <div className="docsApp">
      <a className="skipLink" href="#docs-content">
        Skip to documentation
      </a>
      <header className="docsHeader">
        <div className="docsHeaderInner">
          <Link className="docsBrand" href="/" aria-label="html2realpdf home">
            <Image alt="" height={42} src={siteConfig.logo} width={42} />
            <span>
              <strong>html2realpdf</strong>
              <small>DOCUMENTATION</small>
            </span>
          </Link>
          <nav aria-label="Site" className="docsSiteNav">
            <Link href="/">Home</Link>
            <Link aria-current="page" href="/docs">Docs</Link>
            <Link href="/docs/api-reference">API</Link>
            <a href={siteConfig.repository} rel="noreferrer" target="_blank">GitHub</a>
          </nav>
          <div className="docsHeaderActions">
            <DocsSearch />
            <button
              aria-haspopup="dialog"
              className="docsMenuTrigger"
              onClick={() => mobileDialogRef.current?.showModal()}
              ref={mobileTriggerRef}
              type="button"
            >
              <span aria-hidden="true">☰</span>
              Menu
            </button>
          </div>
        </div>
      </header>

      <div
        className="docsWorkspace"
        data-page={isPlayground ? "playground" : undefined}
        data-sidebar={sidebarCollapsed ? "collapsed" : "expanded"}
      >
        <button
          aria-controls="docs-sidebar"
          aria-expanded={!sidebarCollapsed}
          aria-label={sidebarCollapsed ? "Show documentation sidebar" : "Hide documentation sidebar"}
          className="docsSidebarToggle docsSidebarDockToggle"
          onClick={() => setSidebarOverride(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Show documentation sidebar" : "Hide documentation sidebar"}
          type="button"
        >
          <SidebarToggleIcon collapsed={sidebarCollapsed} />
        </button>
        <aside className="docsSidebar" hidden={sidebarCollapsed} id="docs-sidebar">
          <DocsSidebar tree={tree} />
        </aside>
        <div className="docsStage">
          {children}
          {isPlayground ? null : (
            <footer className="docsFooter">
              <span>html2realpdf documentation</span>
              <span>Copyright © Imggion</span>
            </footer>
          )}
        </div>
      </div>

      <dialog
        aria-labelledby={mobileTitleId}
        className="docsDialog docsMenuDialog"
        onClose={() => mobileTriggerRef.current?.focus()}
        ref={mobileDialogRef}
      >
        <div className="docsDialogTitlebar">
          <strong id={mobileTitleId}>DOCUMENTATION_TREE</strong>
          <button
            aria-label="Close documentation menu"
            onClick={() => mobileDialogRef.current?.close()}
            type="button"
          >
            ×
          </button>
        </div>
        <DocsSidebar tree={tree} />
      </dialog>
    </div>
  );
}
