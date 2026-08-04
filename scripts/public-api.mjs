import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(repositoryRoot, "vendor/html2realpdf/bindings/js");
const packageJsonPath = path.join(packageRoot, "package.json");
const entryPath = path.join(packageRoot, "src/index.ts");
const sourceRoot = path.resolve(packageRoot, "../..");

const typeFormatFlags =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
  ts.TypeFormatFlags.WriteArrowStyleSignature;

function normalizeText(value = "") {
  return value
    .replaceAll("—", "-")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function tagText(tag) {
  if (typeof tag.text === "string") return normalizeText(tag.text);
  if (!tag.text) return "";
  return normalizeText(ts.displayPartsToString(tag.text));
}

function documentationFor(symbol, checker) {
  const tags = symbol.getJsDocTags(checker);
  const grouped = new Map();
  for (let index = 0; index < tags.length; index += 1) {
    const tag = tags[index];
    let value = tagText(tag);
    if (tag.name === "throws" && value === "{" && tags[index + 1]?.name === "link") {
      const link = tagText(tags[index + 1]);
      const closingBrace = link.indexOf("}");
      value = closingBrace === -1
        ? link
        : `\`${link.slice(0, closingBrace)}\`${link.slice(closingBrace + 1)}`;
      index += 1;
    }
    const values = grouped.get(tag.name) ?? [];
    values.push(value);
    grouped.set(tag.name, values);
  }

  return {
    summary: normalizeText(ts.displayPartsToString(symbol.getDocumentationComment(checker))),
    remarks: normalizeText((grouped.get("remarks") ?? []).join("\n\n")),
    examples: grouped.get("example") ?? [],
    throws: grouped.get("throws") ?? [],
    deprecated: normalizeText((grouped.get("deprecated") ?? []).join("\n\n")),
    internal: grouped.has("internal"),
  };
}

function hasModifier(node, kind) {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === kind));
}

function isPublicDeclaration(node, checker) {
  if (
    hasModifier(node, ts.SyntaxKind.PrivateKeyword) ||
    hasModifier(node, ts.SyntaxKind.ProtectedKeyword)
  ) {
    return false;
  }
  const name = node.name && ts.isIdentifier(node.name) ? node.name : undefined;
  const symbol = name ? checker.getSymbolAtLocation(name) : undefined;
  return !symbol || !documentationFor(symbol, checker).internal;
}

function declarationKind(declaration) {
  if (ts.isFunctionDeclaration(declaration)) return "function";
  if (ts.isInterfaceDeclaration(declaration)) return "interface";
  if (ts.isTypeAliasDeclaration(declaration)) return "type-alias";
  if (ts.isClassDeclaration(declaration)) return "class";
  if (ts.isEnumDeclaration(declaration)) return "enumeration";
  return undefined;
}

function findDeclaration(symbol) {
  const declarations = symbol.declarations ?? [];
  return declarations.find((declaration) => declarationKind(declaration));
}

function lineFor(declaration) {
  const sourceFile = declaration.getSourceFile();
  return sourceFile.getLineAndCharacterOfPosition(declaration.getStart(sourceFile)).line + 1;
}

function sourceFor(declaration) {
  const sourceFile = declaration.getSourceFile();
  const relativePath = path.relative(sourceRoot, sourceFile.fileName).replaceAll(path.sep, "/");
  const line = lineFor(declaration);
  return {
    line,
    path: relativePath,
    url: `https://github.com/imggion/html2realpdf/blob/main/${relativePath}#L${line}`,
  };
}

function printNode(node) {
  return normalizeText(
    ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, removeComments: true }).printNode(
      ts.EmitHint.Unspecified,
      node,
      node.getSourceFile(),
    ),
  );
}

function typeParametersFor(node) {
  if (!node.typeParameters?.length) return "";
  return `<${node.typeParameters.map((parameter) => printNode(parameter)).join(", ")}>`;
}

function typeForParameter(parameter, checker) {
  if (parameter.type) return printNode(parameter.type);
  return checker.typeToString(checker.getTypeAtLocation(parameter), parameter, typeFormatFlags);
}

function parameterName(parameter) {
  return printNode(parameter.name);
}

function formatParameter(parameter, checker) {
  const rest = parameter.dotDotDotToken ? "..." : "";
  const optional = parameter.questionToken || parameter.initializer ? "?" : "";
  return `${rest}${parameterName(parameter)}${optional}: ${typeForParameter(parameter, checker)}`;
}

function parametersFor(declaration, checker) {
  return declaration.parameters.map((parameter) => {
    const symbol = ts.isIdentifier(parameter.name)
      ? checker.getSymbolAtLocation(parameter.name)
      : undefined;
    const docs = symbol ? documentationFor(symbol, checker) : { summary: "" };
    return {
      name: parameterName(parameter),
      type: typeForParameter(parameter, checker),
      required: !parameter.questionToken && !parameter.initializer && !parameter.dotDotDotToken,
      defaultValue: parameter.initializer ? printNode(parameter.initializer) : "",
      description: docs.summary,
    };
  });
}

function returnTypeFor(declaration, checker) {
  const signature = checker.getSignatureFromDeclaration(declaration);
  if (!signature) return "void";
  return checker.typeToString(signature.getReturnType(), declaration, typeFormatFlags);
}

function callableSignature(name, declaration, checker, prefix = "export declare function ") {
  const params = declaration.parameters
    .map((parameter) => formatParameter(parameter, checker))
    .join(", ");
  return `${prefix}${name}${typeParametersFor(declaration)}(${params}): ${returnTypeFor(declaration, checker)};`;
}

function typeForMember(symbol, declaration, checker) {
  if (declaration.type) return printNode(declaration.type);
  return checker.typeToString(
    checker.getTypeOfSymbolAtLocation(symbol, declaration),
    declaration,
    typeFormatFlags,
  );
}

function inferredDefault(description) {
  const match = description.match(/Defaults to (.+?)(?:\.|$)/i);
  return match?.[1]?.replaceAll("`", "") ?? "";
}

function publicMembers(symbol, checker) {
  const declaredType = checker.getDeclaredTypeOfSymbol(symbol);
  const ownMembers = symbol.members ? [...symbol.members.values()] : [];
  const members = ownMembers.length > 0 ? ownMembers : checker.getPropertiesOfType(declaredType);
  const output = [];

  for (const member of members) {
    const declarations = (member.declarations ?? []).filter((declaration) =>
      isPublicDeclaration(declaration, checker),
    );
    if (declarations.length === 0) continue;
    const primary = declarations.find((declaration) => declaration.body) ?? declarations.at(-1);
    if (!primary) continue;
    const docs = documentationFor(member, checker);
    if (docs.internal) continue;

    const methodDeclarations = declarations.filter(
      (declaration) => ts.isMethodDeclaration(declaration) || ts.isMethodSignature(declaration),
    );
    if (methodDeclarations.length > 0) {
      const overloads = methodDeclarations.some((declaration) => !declaration.body)
        ? methodDeclarations.filter((declaration) => !declaration.body)
        : methodDeclarations;
      const implementation = methodDeclarations.find((declaration) => declaration.body) ?? primary;
      output.push({
        kind: "method",
        name: member.getName(),
        docs,
        signatures: overloads.map((declaration) =>
          callableSignature(member.getName(), declaration, checker, ""),
        ),
        parameters: parametersFor(implementation, checker),
        returnType: returnTypeFor(implementation, checker),
        source: sourceFor(primary),
      });
      continue;
    }

    const declaration = primary;
    const description = docs.summary;
    output.push({
      kind: "property",
      name: member.getName(),
      docs,
      type: typeForMember(member, declaration, checker),
      required: !Boolean(member.flags & ts.SymbolFlags.Optional),
      readonly:
        hasModifier(declaration, ts.SyntaxKind.ReadonlyKeyword) ||
        ts.isGetAccessorDeclaration(declaration),
      defaultValue:
        "initializer" in declaration && declaration.initializer
          ? printNode(declaration.initializer)
          : inferredDefault(description),
      source: sourceFor(declaration),
    });
  }

  return output.sort((left, right) => left.source.line - right.source.line);
}

function constructorsFor(declaration, checker) {
  if (!ts.isClassDeclaration(declaration)) return [];
  return declaration.members
    .filter(
      (member) => ts.isConstructorDeclaration(member) && isPublicDeclaration(member, checker),
    )
    .map((constructor) => ({
      signature: `constructor(${constructor.parameters
        .map((parameter) => formatParameter(parameter, checker))
        .join(", ")});`,
      parameters: parametersFor(constructor, checker),
      source: sourceFor(constructor),
    }));
}

function signatureFor(api, checker) {
  const { declaration, displayName, kind } = api;
  if (kind === "function") {
    return callableSignature(displayName, declaration, checker);
  }
  if (kind === "class") {
    const heritage = declaration.heritageClauses?.map((clause) => printNode(clause)).join(" ");
    return `export declare class ${displayName}${heritage ? ` ${heritage}` : ""}`;
  }
  return printNode(declaration);
}

function compilerErrors(program) {
  return ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    .map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      if (!diagnostic.file || diagnostic.start === undefined) return message;
      const location = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      return `${path.relative(repositoryRoot, diagnostic.file.fileName)}:${location.line + 1}:${location.character + 1} ${message}`;
    });
}

export function loadPublicApi() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const exportKeys = Object.keys(packageJson.exports ?? {});
  if (exportKeys.length !== 1 || exportKeys[0] !== ".") {
    throw new Error(`Expected one public root export, found: ${exportKeys.join(", ") || "none"}`);
  }
  if (!fs.existsSync(entryPath)) {
    throw new Error(`Public TypeScript entry point is missing: ${entryPath}`);
  }

  const program = ts.createProgram({
    rootNames: [entryPath],
    options: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
      skipLibCheck: true,
      strict: true,
      noEmit: true,
    },
  });
  const errors = compilerErrors(program);
  if (errors.length > 0) {
    throw new Error(`Public API analysis failed:\n${errors.join("\n")}`);
  }

  const checker = program.getTypeChecker();
  const entry = program.getSourceFile(entryPath);
  const moduleSymbol = entry && checker.getSymbolAtLocation(entry);
  if (!entry || !moduleSymbol) throw new Error("Could not resolve the public TypeScript module");

  const symbols = [];
  for (const exportedSymbol of checker.getExportsOfModule(moduleSymbol)) {
    const symbol = exportedSymbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(exportedSymbol)
      : exportedSymbol;
    const declaration = findDeclaration(symbol);
    if (!declaration) continue;
    const kind = declarationKind(declaration);
    if (!kind) continue;
    const displayName =
      exportedSymbol.getName() === "default" && declaration.name && ts.isIdentifier(declaration.name)
        ? declaration.name.text
        : exportedSymbol.getName();
    const docs = documentationFor(symbol, checker);
    if (docs.internal) continue;

    const api = {
      exportName: exportedSymbol.getName(),
      displayName,
      kind,
      declaration,
      symbol,
      docs,
      source: sourceFor(declaration),
    };
    api.signature = signatureFor(api, checker);
    api.parameters = kind === "function" ? parametersFor(declaration, checker) : [];
    api.returnType = kind === "function" ? returnTypeFor(declaration, checker) : "";
    api.members = kind === "class" || kind === "interface" ? publicMembers(symbol, checker) : [];
    api.constructors = constructorsFor(declaration, checker);
    symbols.push(api);
  }

  symbols.sort((left, right) => left.displayName.localeCompare(right.displayName, "en"));
  return {
    packageName: packageJson.name,
    packageVersion: packageJson.version,
    entryPath,
    symbols,
  };
}

export function slugifySymbol(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
