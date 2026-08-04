import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPublicApi, slugifySymbol } from "./public-api.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(repositoryRoot, "content/docs/api-reference/generated");
const apiDataPath = path.join(repositoryRoot, "lib/generated/api-reference.json");
const checkOnly = process.argv.includes("--check");

const categoryConfig = {
  function: { directory: "functions", title: "Functions" },
  class: { directory: "classes", title: "Classes" },
  interface: { directory: "interfaces", title: "Interfaces" },
  "type-alias": { directory: "type-aliases", title: "Type Aliases" },
  enumeration: { directory: "enumerations", title: "Enumerations" },
};

function cleanText(value, fallback) {
  const text = (value || fallback).replaceAll("—", "-").replace(/\s+/g, " ").trim();
  return text.endsWith(".") ? text : `${text}.`;
}

function yaml(value) {
  return JSON.stringify(value.replaceAll("—", "-"));
}

function inlineCode(value) {
  return `\`${value.replaceAll("—", "-").replaceAll("`", "\\`").replaceAll("|", "\\|")}\``;
}

function tableText(value, fallback = "Not documented.") {
  return (value || fallback)
    .replaceAll("—", "-")
    .replace(/\s+/g, " ")
    .replaceAll("|", "\\|")
    .trim();
}

function parameterDescription(parameter) {
  if (parameter.description) return parameter.description;
  if (parameter.name === "options" && parameter.type === "ErrorOptions") {
    return "Optional error cause.";
  }
  const descriptions = {
    source: "HTML string, mounted element, or ref-shaped value to render.",
    options: "Options for this operation.",
    init: "Renderer lifetime configuration.",
    filename: "Download filename.",
    target: "Target stage or preview element.",
    type: "Requested input or output type.",
    value: "Value to apply.",
    theme: "Preview control theme.",
    url: "Object URL created by this document.",
    key: "Compatibility option key.",
    callback: "Optional callback invoked with the resolved value.",
    message: "Human-readable error message.",
    status: "Native renderer or bridge status code.",
    resource: "Resource identifier that failed to load.",
    nodePath: "Snapshot path of the affected canvas.",
    feature: "Unsupported compatibility feature name.",
  };
  return descriptions[parameter.name.replace(/^_/, "")] ?? "Value passed to this API.";
}

function sourceLink(source) {
  return `<SourceLink href=${JSON.stringify(source.url)} line={${source.line}} />`;
}

function signatureBlock(signature) {
  return `<ApiSignature>\n\n\`\`\`ts\n${signature.replaceAll("—", "-")}\n\`\`\`\n\n</ApiSignature>`;
}

function parameterTable(parameters) {
  if (parameters.length === 0) return "This API does not accept parameters.";
  const rows = parameters.map(
    (parameter) =>
      `| ${inlineCode(parameter.name)} | ${inlineCode(parameter.type)} | ${parameter.required ? "Yes" : "No"} | ${parameter.defaultValue ? inlineCode(parameter.defaultValue) : "None"} | ${tableText(parameterDescription(parameter))} |`,
  );
  return [
    "| Parameter | Type | Required | Default | Description |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

function propertyTable(properties) {
  if (properties.length === 0) return "This type has no public properties.";
  const rows = properties.map(
    (property) =>
      `| ${inlineCode(property.name)} | ${inlineCode(property.type)} | ${property.required ? "Yes" : "No"} | ${property.readonly ? "Yes" : "No"} | ${property.defaultValue ? inlineCode(property.defaultValue) : "None"} | ${tableText(property.docs.summary)} |`,
  );
  return [
    "| Property | Type | Required | Read only | Default | Description |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

function examplesSection(examples) {
  if (examples.length === 0) return "";
  const blocks = examples.map((example) => {
    const clean = example.replaceAll("—", "-").trim();
    return clean.startsWith("```") ? clean : `\`\`\`ts\n${clean}\n\`\`\``;
  });
  return `\n## Example\n\n${blocks.join("\n\n")}`;
}

function throwsSection(throwsTags) {
  if (throwsTags.length === 0) return "";
  return `\n## Errors\n\n${throwsTags.map((value) => `- ${value.replaceAll("—", "-")}`).join("\n")}`;
}

function deprecationSection(deprecated) {
  if (!deprecated) return "";
  return `\n<Callout title="Deprecated" type="warning">\n\n${deprecated.replaceAll("—", "-")}\n\n</Callout>\n`;
}

function methodSections(methods) {
  if (methods.length === 0) return "";
  return methods
    .map((method) => {
      const signatures = method.signatures.join("\n");
      return [
        `### \`${method.name}()\``,
        "",
        method.docs.summary || `Public ${method.name} method.`,
        "",
        signatureBlock(signatures),
        "",
        "#### Parameters",
        "",
        parameterTable(method.parameters),
        "",
        "#### Returns",
        "",
        `<ReturnType>${inlineCode(method.returnType)}</ReturnType>`,
        method.docs.throws.length > 0
          ? `\n#### Errors\n\n${method.docs.throws.map((value) => `- ${value}`).join("\n")}`
          : "",
        "",
        sourceLink(method.source),
      ].join("\n");
    })
    .join("\n\n");
}

function renderApiPage(api) {
  const description = cleanText(api.docs.summary, `Public ${api.kind} exported by @imggion/html2realpdf`);
  const properties = api.members.filter((member) => member.kind === "property");
  const methods = api.members.filter((member) => member.kind === "method");
  const sections = [
    "---",
    `title: ${yaml(api.displayName)}`,
    `description: ${yaml(description)}`,
    `apiSymbol: ${yaml(api.displayName)}`,
    `apiKind: ${yaml(api.kind)}`,
    "---",
    "",
    "{/* This file is generated. Do not edit it directly. */}",
    api.docs.summary || description,
    deprecationSection(api.docs.deprecated),
    api.docs.remarks ? `\n${api.docs.remarks}\n` : "",
    "## Signature",
    "",
    signatureBlock(api.signature),
    "",
    sourceLink(api.source),
  ];

  if (api.kind === "function") {
    sections.push(
      "",
      "## Parameters",
      "",
      parameterTable(api.parameters),
      "",
      "## Returns",
      "",
      `<ReturnType>${inlineCode(api.returnType)}</ReturnType>`,
    );
  }

  if (api.constructors.length > 0) {
    const constructor = api.constructors[0];
    sections.push(
      "",
      "## Constructor",
      "",
      signatureBlock(constructor.signature),
      "",
      parameterTable(constructor.parameters),
    );
  }

  if (properties.length > 0 || api.kind === "interface") {
    sections.push("", "## Properties", "", propertyTable(properties));
  }

  if (methods.length > 0) {
    sections.push("", "## Methods", "", methodSections(methods));
  }

  sections.push(throwsSection(api.docs.throws), examplesSection(api.docs.examples));
  return `${sections.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

function renderOverview(groups, api) {
  const categories = Object.entries(groups)
    .filter(([, symbols]) => symbols.length > 0)
    .map(([kind, symbols]) => {
      const config = categoryConfig[kind];
      return `- [${config.title}](./${config.directory}) (${symbols.length})`;
    })
    .join("\n");
  return `---
title: Generated API
description: Public root exports generated from the TypeScript package source.
---

{/* This file is generated. Do not edit it directly. */}

This reference is generated from the public root export of \`${api.packageName}\` version \`${api.packageVersion}\`.

Raw WASM bridge modules are not part of the package export map. They are not included here.

## Symbol groups

${categories}
`;
}

function renderCategory(config, symbols) {
  const links = symbols
    .map((symbol) => `- [\`${symbol.displayName}\`](./${slugifySymbol(symbol.displayName)}) - ${cleanText(symbol.docs.summary, `Public ${symbol.kind}`)}`)
    .join("\n");
  return `---
title: ${config.title}
description: Generated ${config.title.toLowerCase()} exported from the public package root.
---

{/* This file is generated. Do not edit it directly. */}

## Exported symbols

${links}
`;
}

function expectedFiles() {
  const api = loadPublicApi();
  const groups = Object.fromEntries(Object.keys(categoryConfig).map((kind) => [kind, []]));
  for (const symbol of api.symbols) groups[symbol.kind].push(symbol);

  const files = new Map();
  files.set("index.mdx", renderOverview(groups, api));
  const rootPages = ["index"];

  for (const [kind, symbols] of Object.entries(groups)) {
    if (symbols.length === 0) continue;
    const config = categoryConfig[kind];
    rootPages.push(config.directory);
    const pages = ["index", ...symbols.map((symbol) => slugifySymbol(symbol.displayName))];
    files.set(`${config.directory}/index.mdx`, renderCategory(config, symbols));
    files.set(
      `${config.directory}/meta.json`,
      `${JSON.stringify({ title: config.title, pages }, null, 2)}\n`,
    );
    for (const symbol of symbols) {
      files.set(
        `${config.directory}/${slugifySymbol(symbol.displayName)}.mdx`,
        renderApiPage(symbol),
      );
    }
  }

  files.set("meta.json", `${JSON.stringify({ title: "Generated API", pages: rootPages }, null, 2)}\n`);
  return { api, files };
}

function apiData(api) {
  const symbols = {};
  for (const symbol of api.symbols) {
    symbols[symbol.displayName] = {
      kind: symbol.kind,
      summary: symbol.docs.summary,
      source: symbol.source,
      properties: symbol.members
        .filter((member) => member.kind === "property")
        .map((property) => ({
          name: property.name,
          type: property.type,
          required: property.required,
          readonly: property.readonly,
          defaultValue: property.defaultValue,
          description: property.docs.summary,
        })),
    };
  }
  return `${JSON.stringify(
    {
      generatedNotice: "This file is generated. Do not edit it directly.",
      packageName: api.packageName,
      packageVersion: api.packageVersion,
      symbols,
    },
    null,
    2,
  ).replaceAll("—", "-")}\n`;
}

function currentGeneratedFiles(directory, prefix = "") {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...currentGeneratedFiles(absolute, relative));
    else files.push(relative);
  }
  return files.sort();
}

function check(files, data) {
  const failures = [];
  const expectedNames = [...files.keys()].sort();
  const currentNames = currentGeneratedFiles(outputRoot);
  for (const name of expectedNames) {
    const filePath = path.join(outputRoot, name);
    if (!fs.existsSync(filePath)) {
      failures.push(`Missing generated file: ${name}`);
      continue;
    }
    if (fs.readFileSync(filePath, "utf8") !== files.get(name)) {
      failures.push(`Stale generated file: ${name}`);
    }
  }
  for (const name of currentNames) {
    if (!files.has(name)) failures.push(`Unexpected generated file: ${name}`);
  }
  if (!fs.existsSync(apiDataPath)) failures.push("Missing generated API data: lib/generated/api-reference.json");
  else if (fs.readFileSync(apiDataPath, "utf8") !== data) {
    failures.push("Stale generated API data: lib/generated/api-reference.json");
  }
  if (failures.length > 0) {
    throw new Error(`${failures.join("\n")}\nRun npm run docs:generate.`);
  }
}

function write(files, data) {
  fs.rmSync(outputRoot, { force: true, recursive: true });
  for (const [name, content] of files) {
    const filePath = path.join(outputRoot, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }
  fs.mkdirSync(path.dirname(apiDataPath), { recursive: true });
  fs.writeFileSync(apiDataPath, data);
}

const { api, files } = expectedFiles();
const data = apiData(api);
if (checkOnly) check(files, data);
else write(files, data);
console.log(`${checkOnly ? "Checked" : "Generated"} ${api.symbols.length} public API symbols in ${files.size} files.`);
