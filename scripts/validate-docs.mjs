import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPublicApi } from "./public-api.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = path.join(repositoryRoot, "content/docs");

function listFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(absolute));
    else files.push(absolute);
  }
  return files;
}

function relative(filePath) {
  return path.relative(repositoryRoot, filePath).replaceAll(path.sep, "/");
}

function frontmatterFor(filePath, content, failures) {
  const match = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) {
    failures.push(`${relative(filePath)}: missing frontmatter`);
    return {};
  }
  const values = {};
  for (const line of match[1].split("\n")) {
    const field = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.+)$/);
    if (!field) continue;
    let value = field[2].trim();
    if (value.startsWith('"')) {
      try {
        value = JSON.parse(value);
      } catch {
        failures.push(`${relative(filePath)}: invalid quoted frontmatter value for ${field[1]}`);
      }
    }
    values[field[1]] = value;
  }
  return values;
}

function routeFor(filePath) {
  const fromDocs = path.relative(docsRoot, filePath).replaceAll(path.sep, "/");
  const withoutExtension = fromDocs.replace(/\.(?:md|mdx)$/, "");
  const segments = withoutExtension.split("/");
  if (segments.at(-1) === "index") segments.pop();
  return `/docs${segments.length ? `/${segments.join("/")}` : ""}`;
}

function slugifyHeading(value) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_{}()[\]]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function anchorsFor(content) {
  const anchors = new Set();
  for (const match of content.matchAll(/^#{2,6}\s+(.+)$/gm)) {
    anchors.add(slugifyHeading(match[1]));
  }
  for (const match of content.matchAll(/\sid=["']([^"']+)["']/g)) anchors.add(match[1]);
  return anchors;
}

function linksFor(content) {
  const links = [];
  for (const match of content.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    links.push(match[1].replace(/^<|>$/g, ""));
  }
  for (const match of content.matchAll(/\bhref=["']([^"']+)["']/g)) links.push(match[1]);
  return links;
}

function validateLink({ filePath, href, routes, anchors, failures }) {
  if (/^(?:https?:|mailto:|tel:|ftp:)/.test(href)) return;
  if (href.startsWith("#")) {
    const anchor = href.slice(1);
    const pageAnchors = anchors.get(routeFor(filePath));
    if (anchor && !pageAnchors?.has(anchor)) {
      failures.push(`${relative(filePath)}: missing heading anchor ${href}`);
    }
    return;
  }

  const [linkPath, hash] = href.split("#", 2);
  let route;
  if (linkPath.startsWith("/docs")) {
    route = linkPath.replace(/\/$/, "") || "/docs";
  } else if (linkPath.startsWith("/")) {
    return;
  } else {
    const target = path.resolve(path.dirname(filePath), linkPath);
    let candidate = target;
    if (!/\.(?:md|mdx)$/.test(candidate)) {
      const mdx = `${candidate}.mdx`;
      const index = path.join(candidate, "index.mdx");
      candidate = fs.existsSync(mdx) ? mdx : index;
    }
    route = routeFor(candidate);
  }

  if (!routes.has(route)) {
    failures.push(`${relative(filePath)}: broken documentation link ${href}`);
    return;
  }
  if (hash && !anchors.get(route)?.has(hash)) {
    failures.push(`${relative(filePath)}: missing target anchor ${href}`);
  }
}

if (!fs.existsSync(docsRoot)) throw new Error("Documentation directory is missing");

const failures = [];
const allFiles = listFiles(docsRoot);
const contentFiles = allFiles.filter((filePath) => /\.(?:md|mdx)$/.test(filePath));
const routeMap = new Map();
const anchorMap = new Map();
const apiSymbolsInDocs = new Map();

for (const filePath of allFiles) {
  const content = fs.readFileSync(filePath, "utf8");
  if (content.includes("—")) failures.push(`${relative(filePath)}: forbidden em dash character`);
  if (content.includes("chatgpt.com/")) failures.push(`${relative(filePath)}: invalid generated chat link`);
  if (/\t/.test(content)) failures.push(`${relative(filePath)}: tab character found`);
}

for (const filePath of contentFiles) {
  const content = fs.readFileSync(filePath, "utf8");
  const frontmatter = frontmatterFor(filePath, content, failures);
  if (!frontmatter.title) failures.push(`${relative(filePath)}: title is required`);
  if (!frontmatter.description) failures.push(`${relative(filePath)}: description is required`);
  const route = routeFor(filePath);
  if (routeMap.has(route)) failures.push(`${relative(filePath)}: duplicate route ${route}`);
  routeMap.set(route, filePath);
  anchorMap.set(route, anchorsFor(content));

  const generated = relative(filePath).includes("/api-reference/generated/") && filePath.endsWith(".mdx");
  if (generated && path.basename(filePath) !== "index.mdx") {
    if (!content.includes("{/* This file is generated. Do not edit it directly. */}")) {
      failures.push(`${relative(filePath)}: generated notice comment is missing`);
    }
    if (!frontmatter.apiSymbol || !frontmatter.apiKind) {
      failures.push(`${relative(filePath)}: generated API metadata is incomplete`);
    } else if (apiSymbolsInDocs.has(frontmatter.apiSymbol)) {
      failures.push(`${relative(filePath)}: duplicate API symbol ${frontmatter.apiSymbol}`);
    } else {
      apiSymbolsInDocs.set(frontmatter.apiSymbol, filePath);
    }
  }
}

const routes = new Set([...routeMap.keys(), "/docs/llm.txt"]);
for (const filePath of contentFiles) {
  const content = fs.readFileSync(filePath, "utf8");
  for (const href of linksFor(content)) {
    validateLink({ filePath, href, routes, anchors: anchorMap, failures });
  }
}

const publicApi = loadPublicApi();
const publicNames = new Set(publicApi.symbols.map((symbol) => symbol.displayName));
for (const symbol of publicNames) {
  if (!apiSymbolsInDocs.has(symbol)) failures.push(`Missing generated API page for ${symbol}`);
}
for (const [symbol, filePath] of apiSymbolsInDocs) {
  if (!publicNames.has(symbol)) failures.push(`${relative(filePath)}: source symbol ${symbol} is not public`);
}

if (failures.length > 0) {
  console.error(`Documentation validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${contentFiles.length} content files and ${publicNames.size} public API symbols.`);
}
