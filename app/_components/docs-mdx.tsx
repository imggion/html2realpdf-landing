import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { PdfPlayground } from "@/app/_components/pdf-playground";
import { PackageInstallCommand } from "@/app/_components/package-install-command";
import { DocsCodeBlock } from "@/app/docs/_components/docs-code-block";
import apiReference from "@/lib/generated/api-reference.json";

type HeadingProps = ComponentPropsWithoutRef<"h2">;

function AnchoredHeading({ children, id, ...props }: HeadingProps) {
  return (
    <h2 id={id} {...props}>
      {children}
      {id ? (
        <a
          aria-label="Link to this section"
          className="docsHeadingAnchor"
          href={`#${id}`}
        >
          <span aria-hidden="true">#</span>
        </a>
      ) : null}
    </h2>
  );
}

function AnchoredSubheading({ children, id, ...props }: HeadingProps) {
  return (
    <h3 id={id} {...props}>
      {children}
      {id ? (
        <a
          aria-label="Link to this section"
          className="docsHeadingAnchor"
          href={`#${id}`}
        >
          <span aria-hidden="true">#</span>
        </a>
      ) : null}
    </h3>
  );
}

export function ApiSignature({ children }: { children: ReactNode }) {
  return <div className="apiSignature">{children}</div>;
}

export function ReturnType({ children }: { children: ReactNode }) {
  return <div className="apiReturnType">{children}</div>;
}

export function SourceLink({ href, line }: { href: string; line?: number }) {
  return (
    <a className="sourceLink" href={href} rel="noreferrer" target="_blank">
      SOURCE{line ? `:${line}` : ""}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

export function InstallCommand({ packageName }: { packageName: string }) {
  return <PackageInstallCommand packageName={packageName} />;
}

export function Callout({
  children,
  title = "Note",
  type = "info",
}: {
  children: ReactNode;
  title?: string;
  type?: "info" | "warning";
}) {
  return (
    <aside className="docsCallout" data-type={type}>
      <strong>{title}</strong>
      <div>{children}</div>
    </aside>
  );
}

export function CompatibilityStatus({
  children,
  status,
}: {
  children: ReactNode;
  status: "supported" | "limited" | "unsupported";
}) {
  return (
    <div className="compatibilityStatus" data-status={status}>
      <span>{status}</span>
      <div>{children}</div>
    </div>
  );
}

type GeneratedProperty = {
  name: string;
  type: string;
  required: boolean;
  readonly: boolean;
  defaultValue: string;
  description: string;
};

type GeneratedSymbol = {
  kind: string;
  summary: string;
  source: { line: number; url: string };
  properties: GeneratedProperty[];
};

export function ApiTypeTable({
  properties,
  symbol,
}: {
  properties?: string[];
  symbol: string;
}) {
  const symbols = apiReference.symbols as Record<string, GeneratedSymbol>;
  const apiSymbol = symbols[symbol];
  if (!apiSymbol) throw new Error(`Unknown generated API symbol: ${symbol}`);
  const selected = properties
    ? apiSymbol.properties.filter((property) => properties.includes(property.name))
    : apiSymbol.properties;

  return (
    <div className="apiTypeTable">
      <div className="apiTypeTableHeader">
        <span>TYPE_SOURCE</span>
        <code>{symbol}</code>
        <SourceLink href={apiSymbol.source.url} line={apiSymbol.source.line} />
      </div>
      <div className="apiTypeTableScroll">
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Type</th>
              <th>Required</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {selected.map((property) => (
              <tr key={property.name}>
                <td><code>{property.name}</code></td>
                <td><code>{property.type}</code></td>
                <td>{property.required ? "Yes" : "No"}</td>
                <td>{property.defaultValue || "None"}</td>
                <td>{property.description || "See the source signature."}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const docsMdxComponents = {
  ApiSignature,
  ApiTypeTable,
  Callout,
  CompatibilityStatus,
  InstallCommand,
  PdfPlayground,
  ReturnType,
  SourceLink,
  h2: AnchoredHeading,
  h3: AnchoredSubheading,
  pre: DocsCodeBlock,
};
