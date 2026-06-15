/**
 * ast-parser.ts
 * ─────────────────────────────────────────────────────────────────────
 * In-browser Tree-sitter AST parser.
 *
 * HOW IT WORKS (Graphify model, ported to TypeScript/browser):
 *   1. Load tree-sitter WASM + language grammars via CDN
 *   2. Parse each file into a CST (Concrete Syntax Tree)
 *   3. Walk the CST to extract ASTFileResult
 *   4. All processing is LOCAL — source code never leaves the browser
 *
 * SETUP (one-time per app session, called before analyzeProject):
 *   await ASTParser.initialize();
 *
 * USAGE:
 *   const parser = ASTParser.getInstance();
 *   const result = parser.parseFile(filePath, fileContent);
 *
 * FALLBACK:
 *   If WASM loading fails (network, CSP), the parser automatically
 *   falls back to the regex-based heuristics already in Simplicit.
 *   You lose position metadata but ingestion still works.
 *
 * INSTALL:
 *   npm install web-tree-sitter
 *   # CDN grammars are loaded at runtime — no bundler changes needed
 */

import type {
  ASTFileResult,
  ASTComponent,
  ASTAPICall,
  ASTRoute,
  ASTImport,
  ASTTypeDefinition,
  ASTTypeField,
  ASTDataFlow,
  ASTEvidence,
  ASTConfidence,
  HTTPMethod,
  APILibrary,
  ASTProp,
  ASTFramework,
} from "./ast-types";

// ─── Tree-sitter types (web-tree-sitter) ────────────────────────────
// We import the types but load the module dynamically to allow fallback
type TSNode = {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  children: TSNode[];
  childCount: number;
  child: (index: number) => TSNode | null;
  childForFieldName: (name: string) => TSNode | null;
  childrenForFieldName: (name: string) => TSNode[];
  namedChildren: TSNode[];
  parent: TSNode | null;
  isNamed: boolean;
};

type TSTree = { rootNode: TSNode };
type TSParser = {
  setLanguage: (lang: any) => void;
  parse: (source: string) => TSTree;
};

// ─── Module-level state ──────────────────────────────────────────────
let _Parser: any = null;
let _tsxLanguage: any = null;
let _tsLanguage: any = null;
let _jsLanguage: any = null;
let _initialized = false;
let _initError: string | null = null;

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/web-tree-sitter@0.23.0/tree-sitter.wasm";
const GRAMMAR_BASE =
  "https://cdn.jsdelivr.net/npm/tree-sitter-wasms@0.1.11/out";

// ─── Initialization ──────────────────────────────────────────────────
export async function initializeAST(): Promise<boolean> {
  if (_initialized) return true;
  if (_initError) return false;

  try {
    // Dynamic import so the app still loads if this isn't installed
    const TreeSitter = await import("web-tree-sitter").catch(() => null);
    if (!TreeSitter) {
      _initError = "web-tree-sitter not installed";
      return false;
    }

    _Parser = TreeSitter.default ?? TreeSitter;
    await _Parser.init({ locateFile: () => WASM_BASE });

    const [tsx, ts, js] = await Promise.all([
      _Parser.Language.load(`${GRAMMAR_BASE}/tree-sitter-tsx.wasm`),
      _Parser.Language.load(`${GRAMMAR_BASE}/tree-sitter-typescript.wasm`),
      _Parser.Language.load(`${GRAMMAR_BASE}/tree-sitter-javascript.wasm`),
    ]);
    _tsxLanguage = tsx;
    _tsLanguage = ts;
    _jsLanguage = js;

    _initialized = true;
    console.log("[Simplicit AST] Grammars loaded: TSX=tree-sitter-tsx.wasm, TS=tree-sitter-typescript.wasm, JS=tree-sitter-javascript.wasm");
    return true;
  } catch (e) {
    _initError = String(e);
    console.warn("[Simplicit AST] Tree-sitter init failed, using regex fallback:", e);
    return false;
  }
}

export function isASTInitialized(): boolean {
  return _initialized;
}

// ─── Language selector ───────────────────────────────────────────────
function getLanguage(filePath: string): any | null {
  if (!_initialized) return null;
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (ext === "tsx") return _tsxLanguage;
  if (ext === "ts") return _tsLanguage;
  if (ext === "js" || ext === "jsx" || ext === "mjs") return _jsLanguage;
  return null;
}

// ─── Main file parser ────────────────────────────────────────────────
export function parseFile(
  filePath: string,
  source: string,
  detectedFramework: string = "Unknown",
  knownAxiosInstances: Set<string> = new Set()
): ASTFileResult {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "other";
  const language =
    ext === "tsx"
      ? "tsx"
      : ext === "ts"
      ? "typescript"
      : ext === "jsx"
      ? "jsx"
      : ext === "js" || ext === "mjs"
      ? "javascript"
      : "other";

  const result: ASTFileResult = {
    filePath,
    language: language as any,
    components: [],
    routes: [],
    imports: [],
    typeDefinitions: [],
    apiCalls: [],
    dataFlows: [],
    parseError: null,
  };

  if (language === "other") return result;

  const lang = getLanguage(filePath);

  // ── AST path ──────────────────────────────────────────────────────
  if (lang && _Parser) {
    try {
      const parser: TSParser = new _Parser();
      parser.setLanguage(lang);
      const tree: TSTree = parser.parse(source);
      const root = tree.rootNode;

      result.imports = extractImports(root, filePath, source);
      const tsTypeDefs = extractTypeDefinitions(root, filePath, source);
      const propTypeDefs = extractPropTypes(root, filePath, source);
      const zodTypeDefs = extractZodSchemas(root, filePath, source);
      result.typeDefinitions = [...tsTypeDefs, ...propTypeDefs, ...zodTypeDefs];
      result.apiCalls = extractAPICallsFromNode(root, filePath, source, knownAxiosInstances);
      result.dataFlows = extractDataFlows(root, filePath, source);
      result.components = extractComponents(root, filePath, source, result, knownAxiosInstances);
      result.routes = deriveRoutes(filePath, source, detectedFramework, result.components);

      return result;
    } catch (e) {
      result.parseError = String(e);
      // Fall through to regex path
    }
  }

  // ── Regex fallback path (no WASM) ─────────────────────────────────
  result.imports = extractImportsRegex(filePath, source);
  result.typeDefinitions = [
    ...extractTypeDefsRegex(filePath, source),
    ...extractPropTypesRegex(filePath, source),
  ];
  result.apiCalls = extractAPICallsRegex(filePath, source);
  result.components = extractComponentsRegex(filePath, source);
  result.routes = deriveRoutes(filePath, source, detectedFramework, result.components);

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// AST EXTRACTION HELPERS (Tree-sitter path)
// ═══════════════════════════════════════════════════════════════════════

function extractImports(root: TSNode, filePath: string, source: string): ASTImport[] {
  const imports: ASTImport[] = [];
  walkNode(root, (node) => {
    if (node.type !== "import_statement" && node.type !== "import_declaration") return;
    const fromClause = node.childForFieldName("source");
    if (!fromClause) return;
    const fromFile = fromClause.text.replace(/['"]/g, "");
    const specifiers = node.namedChildren.filter(
      (c) =>
        c.type === "import_specifier" ||
        c.type === "named_imports" ||
        c.type === "import_clause"
    );
    if (specifiers.length === 0) {
      // default import: import X from '...'
      const def = node.childForFieldName("default");
      if (def) {
        imports.push({ fromFile, importedName: def.text, isDefault: true, line: node.startPosition.row + 1 });
      }
    }
    for (const spec of specifiers) {
      walkNode(spec, (s) => {
        if (s.type === "identifier" || s.type === "import_specifier") {
          const name = s.childForFieldName("name")?.text ?? s.text;
          if (name && !["as", "from", "import", "{", "}"].includes(name)) {
            imports.push({ fromFile, importedName: name, isDefault: false, line: node.startPosition.row + 1 });
          }
        }
      });
    }
  });
  return imports;
}

function extractTypeDefinitions(root: TSNode, filePath: string, source: string): ASTTypeDefinition[] {
  const defs: ASTTypeDefinition[] = [];

  walkNode(root, (node) => {
    if (
      node.type !== "interface_declaration" &&
      node.type !== "type_alias_declaration" &&
      node.type !== "enum_declaration" &&
      node.type !== "class_declaration"
    )
      return;

    const nameNode =
      node.childForFieldName("name") ??
      node.namedChildren.find((c) => c.type === "type_identifier" || c.type === "identifier");

    if (!nameNode) return;
    const name = nameNode.text;
    if (!name || !/^[A-Z]/.test(name)) return; // Only PascalCase — business types

    const kind =
      node.type === "interface_declaration"
        ? "interface"
        : node.type === "enum_declaration"
        ? "enum"
        : node.type === "class_declaration"
        ? "class"
        : "type";

    const fields: Array<{ name: string; type: string; optional: boolean }> = [];
    const bodyNode =
      node.childForFieldName("body") ??
      node.namedChildren.find((c) => c.type === "object_type" || c.type === "class_body");

    if (bodyNode) {
      for (const child of bodyNode.namedChildren) {
        if (
          child.type === "property_signature" ||
          child.type === "public_field_definition"
        ) {
          const fieldName = child.childForFieldName("name")?.text;
          const typeAnnotation = child.childForFieldName("type")?.text ?? "unknown";
          const optional = child.text.includes("?:");
          if (fieldName) fields.push({ name: fieldName, type: typeAnnotation, optional });
        }
      }
    }

    const line = nameNode.startPosition.row + 1;
    const snippet = source.slice(
      sourceIndexFromPosition(source, node.startPosition.row, 0),
      sourceIndexFromPosition(source, node.startPosition.row + 3, 0)
    ).slice(0, 120);

    defs.push({
      name,
      kind,
      fields,
      filePath,
      line,
      confidence: fields.length > 0 ? "Strong evidence" : "Partial evidence",
      evidence: {
        tag: "EXTRACTED",
        filePath,
        line,
        column: nameNode.startPosition.column,
        snippet,
        confidence: fields.length > 0 ? 90 : 60,
      },
    });
  });

  return defs;
}

function extractPropTypes(
  root: TSNode,
  filePath: string,
  source: string
): ASTTypeDefinition[] {
  const defs: ASTTypeDefinition[] = [];

  walkNode(root, (node) => {
    // Match: ComponentName.propTypes = { ... }
    if (node.type !== "assignment_expression") return;
    const left = node.childForFieldName("left");
    const right = node.childForFieldName("right");
    if (!left || !right) return;

    // left must be "X.propTypes"
    if (
      left.type !== "member_expression" ||
      left.childForFieldName("property")?.text !== "propTypes"
    ) return;

    const componentName = left.childForFieldName("object")?.text;
    if (!componentName || !/^[A-Z]/.test(componentName)) return;

    // right must be an object { ... }
    if (right.type !== "object") return;

    const fields: Array<{ name: string; type: string; optional: boolean }> = [];
    for (const prop of right.namedChildren) {
      if (prop.type !== "pair") continue;
      const key = prop.childForFieldName("key")?.text;
      const value = prop.childForFieldName("value")?.text ?? "unknown";
      if (!key) continue;
      // Derive type from PropTypes.string, PropTypes.number, etc.
      const propType = value.includes("string") ? "string"
        : value.includes("number") ? "number"
        : value.includes("bool") ? "boolean"
        : value.includes("array") ? "array"
        : value.includes("object") ? "object"
        : "unknown";
      const optional = !value.includes(".isRequired");
      fields.push({ name: key, type: propType, optional });
    }

    if (fields.length >= 2) {
      const line = node.startPosition.row + 1;
      // Strip "Card", "Item", "Row" suffix to get entity name
      const entityName = componentName
        .replace(/(Card|Item|Row|Cell|Component|Widget)$/, "")
        .replace(/Page$/, ""); // LoginPage → Login (still filtered by UI_ROUTE_SEGMENTS later)

      defs.push({
        name: entityName || componentName,
        kind: "type",
        fields,
        filePath,
        line,
        confidence: "Partial evidence",
        evidence: {
          tag: "EXTRACTED",
          filePath,
          line,
          column: 0,
          snippet: `PropTypes definition: ${componentName}.propTypes`,
          confidence: 60,
        },
      });
    }
  });

  return defs;
}

function extractZodSchemas(root: any, filePath: string, source: string): ASTTypeDefinition[] {
  const results: ASTTypeDefinition[] = [];

  walkNode(root, (node) => {
    // Match: const/let/var Name = z.object({...}) or export const Name = z.object({...})
    if (node.type !== "lexical_declaration" && node.type !== "variable_declaration") return;

    const declarators = node.namedChildren.filter((c: any) => c.type === "variable_declarator");
    for (const declarator of declarators) {
      const nameNode = declarator.namedChildren.find((c: any) => c.type === "identifier");
      if (!nameNode) continue;
      const name = nameNode.text;
      if (!name) continue;
      // Accept both PascalCase (ProductSchema) and camelCase (productSchema)
      // Zod schemas are conventionally camelCase unlike TypeScript interfaces
      if (!/^[A-Za-z]/.test(name)) continue;

      // Find z.object(...) call on the right-hand side
      const valueNode = declarator.namedChildren.find((c: any) =>
        c.type === "call_expression" || c.type === "await_expression"
      );
      if (!valueNode) continue;

      const callText = valueNode.text;
      if (!callText.startsWith("z.object(")) continue;

      const fields: ASTTypeField[] = [];

      // Walk into the call_expression tree to find the z.object() arguments
      // handles both plain z.object({...}) and chained z.object({...}).refine(...)
      const findZodObjectArgs = (node: any): any | null => {
        if (node.type === "call_expression") {
          const fnNode = node.namedChildren.find((c: any) => c.type === "member_expression" || c.type === "identifier");
          const fnText = fnNode?.text ?? "";
          if (fnText === "z.object" || fnText.endsWith(".object")) {
            return node.namedChildren.find((c: any) => c.type === "arguments");
          }
        }
        // descend through all children so chained calls (z.object({...}).refine(...))
        // where z.object is nested inside a member_expression are still found
        for (const child of node.namedChildren) {
          const found = findZodObjectArgs(child);
          if (found) return found;
        }
        return null;
      };

      const argNode = findZodObjectArgs(valueNode);
      if (argNode) {
        const objNode = argNode.namedChildren.find((c: any) => c.type === "object");
        if (objNode) {
          for (const pair of objNode.namedChildren) {
            if (pair.type !== "pair" && pair.type !== "shorthand_property_identifier") continue;
            const keyNode = pair.namedChildren[0];
            const valNode = pair.namedChildren[1];
            if (!keyNode) continue;
            const fieldName = keyNode.text;
            let fieldType = "text";
            if (valNode) {
              const valText = valNode.text;
              if (valText.includes("z.string")) fieldType = "varchar";
              else if (valText.includes("z.number")) fieldType = "integer";
              else if (valText.includes("z.boolean")) fieldType = "boolean";
              else if (valText.includes("z.date")) fieldType = "timestamp";
              else if (valText.includes("z.array")) fieldType = "jsonb";
              else if (valText.includes("z.object")) fieldType = "jsonb";
              else if (valText.includes("z.enum")) fieldType = "varchar";
            }
            fields.push({
              name: fieldName,
              type: fieldType,
              optional: valNode ? valNode.text.includes(".optional()") || valNode.text.includes(".nullable()") : false,
              isArray: valNode ? valNode.text.includes("z.array(") : false,
            });
          }
        }
      }

      const line = (node.startPosition?.row ?? 0) + 1;
      results.push({
        name,
        kind: "zod-schema",
        fields,
        filePath,
        line,
        confidence: "Deterministic",
        evidence: {
          tag: "EXTRACTED",
          filePath,
          line,
          column: nameNode.startPosition?.column ?? 0,
          snippet: callText.slice(0, 120),
          confidence: 90,
        },
      });
    }
  });

  return results;
}

function extractAPICallsFromNode(
  root: TSNode,
  filePath: string,
  source: string,
  knownAxiosInstances: Set<string> = new Set()
): ASTAPICall[] {
  const calls: ASTAPICall[] = [];

  walkNode(root, (node) => {
    if (node.type !== "call_expression") return;
    const callee = node.childForFieldName("function") ?? node.child(0);
    if (!callee) return;
    const calleeText = callee.text;

    // ── fetch(...) ────────────────────────────────────────────────
    if (calleeText === "fetch") {
      const args = node.childForFieldName("arguments") ?? node.namedChildren.find((c) => c.type === "arguments");
      const firstArg = args?.namedChildren[0];
      if (!firstArg) return;
      let rawUrl: string | null = null;

      if (firstArg.type === "string") {
        rawUrl = firstArg.text.replace(/['"` ]/g, "");
      } else if (firstArg.type === "template_string") {
        // Template literal: fetch(`/api/users/${id}`)  →  /api/users/:param
        const parts: string[] = [];
        for (const child of firstArg.children) {
          if (child.type === "string_fragment") parts.push(child.text);
          else if (child.type === "template_substitution") parts.push(":param");
        }
        rawUrl = parts.join("");
        if (!rawUrl.startsWith("/") && !rawUrl.startsWith("http")) rawUrl = null;
      } else {
        return; // dynamic non-template expression — cannot resolve
      }

      if (!rawUrl) return;

      const method = extractFetchMethod(args, source);
      const line = node.startPosition.row + 1;

      calls.push(buildAPICall("fetch", method, rawUrl, filePath, line, source, node));
    }

    // ── axios.get / axios.post / ... ──────────────────────────────
    if (calleeText.startsWith("axios.")) {
      const methodPart = calleeText.split(".")[1]?.toUpperCase() as HTTPMethod;
      const args = node.childForFieldName("arguments") ?? node.namedChildren.find((c) => c.type === "arguments");
      const firstArg = args?.namedChildren[0];
      const rawUrl = firstArg?.type === "string" ? firstArg.text.replace(/['"` ]/g, "") : null;
      const line = node.startPosition.row + 1;

      calls.push(buildAPICall("axios", methodPart || "GET", rawUrl, filePath, line, source, node));
    }

    // ── Named axios instance: request.get/post/put/patch/delete ──────────
    // Matches: request.get('/url'), api.post('/url'), http.delete('/url')
    // Instance names are discovered in Pass 1 from axios.create() calls
    const calleeBase = calleeText.split(".")[0]; // "request" from "request.get"
    const calleeMethod = calleeText.split(".")[1]; // "get" from "request.get"

    if (
      knownAxiosInstances.size > 0 &&
      knownAxiosInstances.has(calleeBase) &&
      calleeMethod &&
      ["get", "post", "put", "patch", "delete", "head"].includes(calleeMethod.toLowerCase())
    ) {
      const method = calleeMethod.toUpperCase() as HTTPMethod;
      const args = node.childForFieldName("arguments") ??
        node.namedChildren.find((c) => c.type === "arguments");
      const firstArg = args?.namedChildren[0];
      const line = node.startPosition.row + 1;

      // Handle plain string URL
      if (firstArg?.type === "string") {
        const url = firstArg.text.replace(/['"` ]/g, "");
        calls.push(buildAPICall("axios", method, url, filePath, line, source, node));
      }
      // Handle template literal URL: request.get(`/users/${id}`)
      else if (firstArg?.type === "template_string") {
        const parts: string[] = [];
        for (const child of firstArg.children) {
          if (child.type === "string_fragment") parts.push(child.text);
          else if (child.type === "template_substitution") parts.push(":param");
        }
        const urlPattern = parts.join("");
        if (urlPattern.startsWith("/") || urlPattern.startsWith("http")) {
          calls.push(buildAPICall("axios", method, urlPattern, filePath, line, source, node));
        }
      }
    }

    // ── useQuery({ queryFn: () => fetch(...) }) ───────────────────
    if (calleeText === "useQuery" || calleeText === "useSWR") {
      const args = node.childForFieldName("arguments") ?? node.namedChildren.find((c) => c.type === "arguments");
      const queryKeyNode = findDescendantByFieldOrType(args, "array");
      const firstKeyElement = queryKeyNode?.namedChildren[0];
      const keyName = firstKeyElement?.type === "string" ? firstKeyElement.text.replace(/['"]/g, "") : null;

      if (keyName) {
        const line = node.startPosition.row + 1;
        calls.push(buildAPICall(
          calleeText === "useSWR" ? "swr" : "react-query",
          "GET",
          null,
          filePath,
          line,
          source,
          node,
          keyName
        ));
      }
    }

    // ── supabase.from('table').select/insert/update/delete ───────────
    if (calleeText.endsWith(".from")) {
      const args = node.childForFieldName("arguments") ?? node.namedChildren.find((c) => c.type === "arguments");
      const firstArg = args?.namedChildren[0];
      const tableName = firstArg?.type === "string" ? firstArg.text.replace(/['"` ]/g, "") : null;
      if (tableName) {
        const line = node.startPosition.row + 1;
        const idx = sourceIndexFromPosition(source, node.startPosition.row, node.startPosition.column);
        const ctx = source.slice(idx, idx + 120);
        const method: HTTPMethod =
          ctx.includes(".insert") ? "POST" :
          ctx.includes(".update") ? "PUT" :
          ctx.includes(".delete") ? "DELETE" :
          "GET";
        calls.push(buildAPICall("unknown", method, `/api/${tableName}`, filePath, line, source, node));
      }
    }
  });

  return calls;
}

function extractDataFlows(root: TSNode, filePath: string, source: string): ASTDataFlow[] {
  const flows: ASTDataFlow[] = [];

  walkNode(root, (node) => {
    if (node.type !== "call_expression") return;
    const calleeText = (node.childForFieldName("function") ?? node.child(0))?.text ?? "";

    // zustand: create((set) => ({ ... }))
    if (calleeText === "create" || calleeText.endsWith(".create")) {
      const parentDecl = nearestVariableDeclarator(node);
      const storeName = parentDecl?.childForFieldName("name")?.text ?? null;
      if (storeName) {
        flows.push({
          kind: "zustand",
          name: storeName,
          stateShape: extractObjectShapeFromCallback(node),
          filePath,
          line: node.startPosition.row + 1,
        });
      }
    }

    // createContext()
    if (calleeText === "createContext") {
      const parentDecl = nearestVariableDeclarator(node);
      const ctxName = parentDecl?.childForFieldName("name")?.text ?? "UnknownContext";
      flows.push({
        kind: "context",
        name: ctxName,
        stateShape: {},
        filePath,
        line: node.startPosition.row + 1,
      });
    }

    // Axios instance: const request = axios.create({...})
    // or: const api = axios.create({...})
    if (
      calleeText === "axios.create" ||
      (calleeText === "create" && nodeSourceContains(node, "axios"))
    ) {
      const parentDecl = nearestVariableDeclarator(node);
      const instanceName = parentDecl?.childForFieldName("name")?.text ?? null;
      if (instanceName && instanceName.length > 0 && instanceName.length < 30) {
        flows.push({
          kind: "unknown", // reusing existing kind field
          name: `__axios_instance__${instanceName}`,
          stateShape: {},
          filePath,
          line: node.startPosition.row + 1,
        });
      }
    }
  });

  return flows;
}

function extractComponents(
  root: TSNode,
  filePath: string,
  source: string,
  fileResult: ASTFileResult,
  knownAxiosInstances: Set<string> = new Set()
): ASTComponent[] {
  const astResult = extractComponentsAST(root, filePath, source, fileResult, knownAxiosInstances);
  // If AST found nothing but file clearly contains JSX, use regex fallback
  if (astResult.length === 0 && (source.includes("</") || source.includes("/>"))) {
    return extractComponentsRegex(filePath, source);
  }
  return astResult;
}

function extractComponentsAST(
  root: TSNode,
  filePath: string,
  source: string,
  fileResult: ASTFileResult,
  knownAxiosInstances: Set<string> = new Set()
): ASTComponent[] {
  const components: ASTComponent[] = [];

  walkNode(root, (node) => {
    if (
      node.type !== "function_declaration" &&
      node.type !== "arrow_function" &&
      node.type !== "function_expression"
    )
      return;

    // Must return JSX
    if (!subtreeContainsJSX(node)) return;

    let name = extractFunctionName(node);

    // App Router anonymous default exports: export default function() { ... }
    // derive name from file path e.g. app/(shop)/products/page.tsx → Page
    if (!name) {
      const fileName = filePath.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') ?? '';
      // strip route group parens: (shop) → ignore, page → Page
      const clean = fileName.replace(/^\(.*?\)$/, '').trim();
      if (clean) {
        name = clean.charAt(0).toUpperCase() + clean.slice(1);
      }
    }

    if (!name) return;
    if (!/^[A-Z]/.test(name)) return;

    const line = node.startPosition.row + 1;
    const props = extractPropsFromFunction(node, fileResult.typeDefinitions);
    const stateFields = extractStateFields(node);
    const contextDeps = extractContextDeps(node);
    const apiCalls = extractAPICallsFromNode(node, filePath, source, knownAxiosInstances);
    const childComponents = extractChildComponents(node);
    const hasForm = subtreeContainsTag(node, ["form", "Form"]) || source.includes("useForm");
    const hasTable = subtreeContainsTag(node, ["table", "Table", "DataTable"]);
    const hasChart = subtreeContainsTag(node, ["Chart", "LineChart", "BarChart", "PieChart", "ResponsiveContainer"]);

    const exportType = detectExportType(node, root);
    const snippet = source.slice(
      sourceIndexFromPosition(source, node.startPosition.row, 0),
      sourceIndexFromPosition(source, node.startPosition.row + 2, 0)
    ).slice(0, 120);

    components.push({
      name,
      filePath,
      line,
      exportType,
      props,
      stateFields,
      contextDependencies: contextDeps,
      apiCalls,
      childComponents,
      hasForm,
      hasTable,
      hasChart,
      confidence: props.length > 0 ? "Strong evidence" : "Partial evidence",
      evidence: [
        {
          tag: "EXTRACTED",
          filePath,
          line,
          column: node.startPosition.column,
          snippet,
          confidence: 85,
        },
      ],
    });
  });

  return components;
}

// ─── Route derivation (runs on BOTH paths) ───────────────────────────
export function deriveRoutes(
  filePath: string,
  source: string,
  framework: string,
  components: ASTComponent[]
): ASTRoute[] {
  // Skip Next.js internal files — never domain routes
  const NEXTJS_SPECIAL_FILES = new Set([
    "_app", "_document", "_error", "_middleware",
    "middleware", "instrumentation", "next.config",
    "next-env"
  ]);

  const filename = filePath.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
  const cleanFilename = filename.replace(/^_/, "");
  if (NEXTJS_SPECIAL_FILES.has(filename) || NEXTJS_SPECIAL_FILES.has(cleanFilename)) {
    return []; // Not a route
  }

  const routes: ASTRoute[] = [];
  // Ensure exactly one leading slash so `/app/`, `/pages/`, `/routes/` patterns
  // match whether the dir is at the project root (e.g. "app/...") or nested
  // (e.g. "src/app/..."). Root normalization can strip the leading slash.
  const normalized = "/" + filePath.replace(/\\/g, "/").replace(/^\/+/, "");

  // ── Next.js App Router: app/**/page.tsx ──────────────────────────
  const appRouteMatch = normalized.match(/\/app\/(.+)\/page\.(tsx?|jsx?)$/);
  if (appRouteMatch && (framework === "Next.js" || normalized.includes("/app/"))) {
    const raw = appRouteMatch[1];
    const routePath = nextjsFilePathToRoute(raw);
    routes.push(buildRoute(routePath, filePath, "nextjs-app", "page", source, components));
  }

  // ── Next.js App Router: API route.ts ────────────────────────────
  const apiRouteMatch = normalized.match(/\/app\/(.+)\/route\.(ts|js)$/);
  if (apiRouteMatch) {
    const raw = apiRouteMatch[1];
    const routePath = nextjsFilePathToRoute(raw);
    const httpMethods = extractExportedHTTPMethods(source);
    routes.push(buildRoute(routePath, filePath, "nextjs-app", "api", source, components, httpMethods));
  }

  // ── Next.js Pages Router ─────────────────────────────────────────
  const pagesMatch = normalized.match(/\/pages\/(?!api\/)(.+)\.(tsx?|jsx?)$/);
  if (pagesMatch && !normalized.includes("/_")) {
    const raw = pagesMatch[1].replace(/\/index$/, "");
    const routePath = nextjsFilePathToRoute(raw);
    routes.push(buildRoute(routePath || "/", filePath, "nextjs-pages", "page", source, components));
  }

  // ── Next.js Pages API ────────────────────────────────────────────
  const pagesApiMatch = normalized.match(/\/pages\/api\/(.+)\.(tsx?|jsx?)$/);
  if (pagesApiMatch) {
    const raw = pagesApiMatch[1].replace(/\/index$/, "");
    const routePath = `/api/${raw.replace(/\[([^\]]+)\]/g, ":$1")}`;
    routes.push(buildRoute(routePath, filePath, "nextjs-pages", "api", source, components));
  }

  // ── SvelteKit ────────────────────────────────────────────────────
  const svelteMatch = normalized.match(/\/routes\/(.+)\/\+page\.(svelte|ts|js)$/);
  if (svelteMatch) {
    const routePath = ("/" + svelteMatch[1]).replace(/\[([^\]]+)\]/g, ":$1");
    routes.push(buildRoute(routePath, filePath, "sveltekit", "page", source, components));
  }

  // ── Astro ────────────────────────────────────────────────────────
  const astroMatch = normalized.match(/\/src\/pages\/(.+)\.(astro|md|mdx)$/);
  if (astroMatch) {
    const routePath = nextjsFilePathToRoute(astroMatch[1].replace(/\/index$/, ""));
    routes.push(buildRoute(routePath || "/", filePath, "astro", "page", source, components));
  }

  return routes;
}

// ═══════════════════════════════════════════════════════════════════════
// REGEX FALLBACK EXTRACTION (no WASM)
// ═══════════════════════════════════════════════════════════════════════

function extractImportsRegex(filePath: string, source: string): ASTImport[] {
  const imports: ASTImport[] = [];
  const regex = /import\s+(?:(\w+)|(?:\{([^}]+)\})|(?:(\w+),\s*\{([^}]+)\}))\s+from\s+['"`]([^'"`]+)['"`]/g;
  let match: RegExpExecArray | null;
  let lineNum = 1;

  const lines = source.split("\n");
  const lineOfMatch = (idx: number) => {
    let chars = 0;
    for (let i = 0; i < lines.length; i++) {
      chars += lines[i].length + 1;
      if (chars > idx) return i + 1;
    }
    return 1;
  };

  while ((match = regex.exec(source)) !== null) {
    const fromFile = match[5];
    const defaultImport = match[1] || match[3];
    const namedImports = match[2] || match[4];
    const line = lineOfMatch(match.index);

    if (defaultImport) {
      imports.push({ fromFile, importedName: defaultImport, isDefault: true, line });
    }
    if (namedImports) {
      namedImports.split(",").forEach((n) => {
        const name = n.trim().split(/\s+as\s+/)[0].trim();
        if (name) imports.push({ fromFile, importedName: name, isDefault: false, line });
      });
    }
  }
  return imports;
}

function extractTypeDefsRegex(filePath: string, source: string): ASTTypeDefinition[] {
  const defs: ASTTypeDefinition[] = [];
  const regex = /(interface|type)\s+([A-Z]\w*)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source)) !== null) {
    const name = match[2];
    const line = source.slice(0, match.index).split("\n").length;
    defs.push({
      name,
      kind: match[1] as "interface" | "type",
      fields: [],
      filePath,
      line,
      confidence: "Partial evidence",
      evidence: {
        tag: "INFERRED",
        filePath,
        line,
        column: 0,
        snippet: match[0].slice(0, 80),
        confidence: 50,
      },
    });
  }
  return defs;
}

function extractPropTypesRegex(filePath: string, source: string): ASTTypeDefinition[] {
  const defs: ASTTypeDefinition[] = [];
  // Match: ComponentName.propTypes = {
  const rx = /([A-Z]\w*)\.propTypes\s*=\s*\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(source)) !== null) {
    const componentName = m[1];
    const body = m[2];
    const fields: Array<{ name: string; type: string; optional: boolean }> = [];
    const fieldRx = /(\w+)\s*:\s*PropTypes\.(\w+)/g;
    let fm: RegExpExecArray | null;
    while ((fm = fieldRx.exec(body)) !== null) {
      fields.push({
        name: fm[1],
        type: fm[2],
        optional: !body.includes(`${fm[1]}.*isRequired`)
      });
    }
    if (fields.length >= 2) {
      const line = source.slice(0, m.index).split("\n").length;
      const entityName = componentName.replace(/(Card|Item|Row|Page|Component)$/, "") || componentName;
      defs.push({
        name: entityName,
        kind: "type",
        fields,
        filePath,
        line,
        confidence: "Partial evidence",
        evidence: {
          tag: "INFERRED",
          filePath,
          line,
          column: 0,
          snippet: `${componentName}.propTypes`,
          confidence: 55,
        },
      });
    }
  }
  return defs;
}

function extractAPICallsRegex(filePath: string, source: string): ASTAPICall[] {
  const calls: ASTAPICall[] = [];
  const lineOf = (idx: number) => source.slice(0, idx).split("\n").length;

  // fetch('...')
  const fetchRx = /fetch\(\s*['"`]([^'"`\s]+)['"`]/g;
  let m: RegExpExecArray | null;
  while ((m = fetchRx.exec(source)) !== null) {
    const url = m[1];
    if (!url.startsWith("/") && !url.startsWith("http")) continue;
    const method = guessMethodFromContext(source, m.index);
    const line = lineOf(m.index);
    calls.push(buildAPICall("fetch", method, url, filePath, line, source, null));
  }

  // axios.get/post/put/patch/delete('...')
  const axiosRx = /axios\.(get|post|put|patch|delete)\(\s*['"`]([^'"`\s]+)['"`]/g;
  while ((m = axiosRx.exec(source)) !== null) {
    const method = m[1].toUpperCase() as HTTPMethod;
    const url = m[2];
    const line = lineOf(m.index);
    calls.push(buildAPICall("axios", method, url, filePath, line, source, null));
  }

  // supabase.from('tableName').select/insert/update/delete
  const supabaseRx = /\.from\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  while ((m = supabaseRx.exec(source)) !== null) {
    const tableName = m[1];
    const line = lineOf(m.index);
    const ctx = source.slice(Math.max(0, m.index - 30), m.index + 60);
    const method: HTTPMethod =
      ctx.includes(".insert") ? "POST" :
      ctx.includes(".update") ? "PUT" :
      ctx.includes(".delete") ? "DELETE" :
      "GET";
    calls.push(buildAPICall(
      "unknown", method, `/api/${tableName}`, filePath, line, source, null
    ));
  }

  return calls;
}

function extractComponentsRegex(filePath: string, source: string): ASTComponent[] {
  const components: ASTComponent[] = [];
  // Match: export default function MyComponent / export const MyComponent = () =>
  const rx = /(?:export\s+(?:default\s+)?)?(?:function|const)\s+([A-Z][A-Za-z0-9_]*)\s*[=(]/g;
  let m: RegExpExecArray | null;

  while ((m = rx.exec(source)) !== null) {
    const name = m[1];
    const lineNum = source.slice(0, m.index).split("\n").length;
    // Only consider if there's JSX nearby
    const chunk = source.slice(m.index, m.index + 600);
    if (!chunk.includes("<") || !chunk.includes("/>")) continue;

    const hasForm =
      chunk.includes("<form") ||
      chunk.includes("useForm") ||
      chunk.includes("handleSubmit");
    const hasTable = chunk.includes("<table") || chunk.includes("Table");
    const hasChart =
      chunk.includes("Chart") || chunk.includes("recharts") || chunk.includes("Recharts");

    const exportType: ASTComponent["exportType"] = source
      .slice(m.index - 15, m.index)
      .includes("default")
      ? "default"
      : m[0].includes("export")
      ? "named"
      : "none";

    components.push({
      name,
      filePath,
      line: lineNum,
      exportType,
      props: [],
      stateFields: extractStateFieldsRegex(chunk),
      contextDependencies: extractContextDepsRegex(chunk),
      apiCalls: extractAPICallsRegex(filePath, source),
      childComponents: extractChildComponentsRegex(chunk),
      hasForm,
      hasTable,
      hasChart,
      confidence: "Partial evidence",
      evidence: [
        {
          tag: "INFERRED",
          filePath,
          line: lineNum,
          column: 0,
          snippet: m[0].slice(0, 80),
          confidence: 50,
        },
      ],
    });
  }

  return components;
}

// ═══════════════════════════════════════════════════════════════════════
// SHARED UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

function buildAPICall(
  library: string,
  method: HTTPMethod | string,
  url: string | null,
  filePath: string,
  line: number,
  source: string,
  node: TSNode | null,
  keyHint?: string
): ASTAPICall {
  const safeMethod: HTTPMethod = (
    ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(String(method).toUpperCase())
      ? String(method).toUpperCase()
      : "GET"
  ) as HTTPMethod;

  const safeUrl = url?.startsWith("/") || url?.startsWith("http") ? url : null;
  const urlPattern = safeUrl ? safeUrl.replace(/\/[0-9a-f-]{8,}/g, "/:id") : keyHint ? `/${keyHint}` : null;
  const confidence: ASTConfidence = safeUrl ? "Strong evidence" : "Partial evidence";

  return {
    method: safeMethod,
    url: safeUrl,
    urlPattern,
    library: library as APILibrary,
    line,
    filePath,
    confidence,
    evidence: {
      tag: safeUrl ? "EXTRACTED" : "INFERRED",
      filePath,
      line,
      column: 0,
      snippet: source.slice(
        Math.max(0, (node?.startPosition.row ?? line - 1) * 40),
        (node?.startPosition.row ?? line - 1) * 40 + 80
      ).slice(0, 80),
      confidence: safeUrl ? 85 : 45,
    },
  };
}

function buildRoute(
  routePath: string,
  filePath: string,
  framework: ASTFramework,
  kind: ASTRoute["kind"],
  source: string,
  components: ASTComponent[],
  httpMethods: HTTPMethod[] = []
): ASTRoute {
  const params = extractParamSegments(routePath);
  const isProtected = detectIsProtected(source);
  const confidence: ASTConfidence = framework.startsWith("nextjs") ? "Strong evidence" : "Partial evidence";

  return {
    path: routePath,
    filePath,
    framework,
    kind,
    isDynamic: params.length > 0,
    isProtected,
    paramSegments: params,
    httpMethods,
    confidence,
    evidence: [
      {
        tag: "EXTRACTED",
        filePath,
        line: 1,
        column: 0,
        snippet: `File: ${filePath}`,
        confidence: kind === "api" ? 95 : 80,
      },
    ],
  };
}

function nextjsFilePathToRoute(raw: string): string {
  return (
    "/" +
    raw
      .replace(/\/\([^)]+\)/g, "") // strip route groups (dashboard)
      .replace(/\[\.\.\.([^\]]+)\]/g, "*$1") // [...slug] → *slug
      .replace(/\[([^\]]+)\]/g, ":$1") // [id] → :id
      .replace(/\/+/g, "/")
      .replace(/^\//, "")
  );
}

function extractParamSegments(routePath: string): string[] {
  return Array.from(routePath.matchAll(/:([^/]+)/g)).map((m) => m[1]);
}

function detectIsProtected(source: string): boolean {
  const lower = source.toLowerCase();
  return (
    lower.includes("withauth") ||
    lower.includes("useauth") ||
    lower.includes("redirect('/login')") ||
    lower.includes("redirect(\"/login\")") ||
    lower.includes("authguard") ||
    lower.includes("requireauth") ||
    lower.includes("session")
  );
}

function extractExportedHTTPMethods(source: string): HTTPMethod[] {
  const methods: HTTPMethod[] = [];
  const httpVerbs: HTTPMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  for (const verb of httpVerbs) {
    if (
      source.includes(`export async function ${verb}`) ||
      source.includes(`export function ${verb}`) ||
      source.includes(`export const ${verb}`)
    ) {
      methods.push(verb);
    }
  }
  return methods;
}

function extractFetchMethod(argsNode: TSNode | null | undefined, source: string): HTTPMethod {
  if (!argsNode) return "GET";
  const text = argsNode.text;
  if (text.includes("'POST'") || text.includes('"POST"')) return "POST";
  if (text.includes("'PUT'") || text.includes('"PUT"')) return "PUT";
  if (text.includes("'PATCH'") || text.includes('"PATCH"')) return "PATCH";
  if (text.includes("'DELETE'") || text.includes('"DELETE"')) return "DELETE";
  return "GET";
}

function guessMethodFromContext(source: string, idx: number): HTTPMethod {
  const ctx = source.slice(Math.max(0, idx - 100), idx + 100).toUpperCase();
  if (ctx.includes("'POST'") || ctx.includes('"POST"')) return "POST";
  if (ctx.includes("'PUT'") || ctx.includes('"PUT"')) return "PUT";
  if (ctx.includes("'PATCH'") || ctx.includes('"PATCH"')) return "PATCH";
  if (ctx.includes("'DELETE'") || ctx.includes('"DELETE"')) return "DELETE";
  return "GET";
}

function extractPropsFromFunction(
  node: TSNode,
  typeDefs: ASTTypeDefinition[]
): ASTProp[] {
  const props: ASTProp[] = [];
  const params = node.childForFieldName("parameters");
  if (!params) return props;

  const firstParam = params.namedChildren[0];
  if (!firstParam) return props;

  // Destructured props: ({ name, age }: UserProps) or ({ name }: { name: string })
  if (firstParam.type === "object_pattern" || firstParam.type === "required_parameter") {
    const typeAnnotation =
      firstParam.childForFieldName("type") ??
      firstParam.namedChildren.find((c) => c.type === "type_annotation");

    const typeName = typeAnnotation?.namedChildren[0]?.text ?? null;
    const typeDef = typeName ? typeDefs.find((t) => t.name === typeName) : null;

    if (typeDef) {
      // Best case: we have the interface/type definition
      for (const field of typeDef.fields) {
        props.push({
          name: field.name,
          type: field.type,
          required: !field.optional,
          defaultValue: null,
        });
      }
    } else {
      // Fallback: extract from destructuring pattern
      const pattern =
        firstParam.type === "required_parameter"
          ? firstParam.namedChildren[0]
          : firstParam;
      if (pattern) {
        for (const child of pattern.namedChildren) {
          if (child.type === "shorthand_property_identifier_pattern" || child.type === "pair_pattern") {
            const propName = child.childForFieldName("key")?.text ?? child.text;
            if (propName && !["children", "className", "style"].includes(propName)) {
              props.push({ name: propName, type: "unknown", required: true, defaultValue: null });
            }
          }
        }
      }
    }
  }

  return props;
}

function extractStateFields(node: TSNode): string[] {
  const fields: string[] = [];
  walkNode(node, (n) => {
    if (n.type !== "call_expression") return;
    const callee = n.child(0)?.text ?? "";
    if (callee !== "useState" && !callee.endsWith(".useState")) return;

    // const [name, setName] = useState(...)
    const decl = n.parent?.parent;
    if (decl?.type === "array_pattern") {
      const varName = decl.child(0)?.text;
      if (varName && !varName.startsWith("set")) fields.push(varName);
    } else if (decl?.type === "variable_declarator") {
      const pattern = decl.childForFieldName("name");
      if (pattern?.type === "array_pattern") {
        const varName = pattern.child(0)?.text;
        if (varName && !varName.startsWith("set")) fields.push(varName);
      }
    }
  });
  return [...new Set(fields)];
}

function extractStateFieldsRegex(chunk: string): string[] {
  const fields: string[] = [];
  const rx = /const\s+\[(\w+),\s*set\w+\]\s*=\s*useState/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(chunk)) !== null) fields.push(m[1]);
  return fields;
}

function extractContextDeps(node: TSNode): string[] {
  const deps: string[] = [];
  walkNode(node, (n) => {
    if (n.type !== "call_expression") return;
    if (n.child(0)?.text !== "useContext") return;
    const arg = n.childForFieldName("arguments")?.namedChildren[0]?.text;
    if (arg) deps.push(arg);
  });
  return [...new Set(deps)];
}

function extractContextDepsRegex(chunk: string): string[] {
  const deps: string[] = [];
  const rx = /useContext\(\s*(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(chunk)) !== null) deps.push(m[1]);
  return deps;
}

function extractChildComponents(node: TSNode): string[] {
  const children: string[] = [];
  walkNode(node, (n) => {
    if (n.type !== "jsx_opening_element" && n.type !== "jsx_self_closing_element") return;
    const tagName = n.child(1)?.text ?? n.namedChildren[0]?.text;
    if (tagName && /^[A-Z]/.test(tagName)) children.push(tagName);
  });
  return [...new Set(children)];
}

function extractChildComponentsRegex(chunk: string): string[] {
  const children: string[] = [];
  const rx = /<([A-Z][A-Za-z0-9]*)/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(chunk)) !== null) children.push(m[1]);
  return [...new Set(children)];
}

function subtreeContainsJSX(node: TSNode): boolean {
  if (
    node.type === "jsx_element" ||
    node.type === "jsx_fragment" ||
    node.type === "jsx_self_closing_element" ||
    node.type === "jsx_opening_element" ||
    (node.type === "return_statement" && node.text.includes("</")) ||
    (node.type === "return_statement" && node.text.includes("/>"))
  ) return true;
  for (const child of node.children) {
    if (subtreeContainsJSX(child)) return true;
  }
  return false;
}

function subtreeContainsTag(node: TSNode, tags: string[]): boolean {
  if (
    (node.type === "jsx_opening_element" || node.type === "jsx_self_closing_element") &&
    tags.some((t) => node.child(1)?.text === t || node.namedChildren[0]?.text === t)
  )
    return true;
  for (const child of node.children) {
    if (subtreeContainsTag(child, tags)) return true;
  }
  return false;
}

function extractFunctionName(node: TSNode): string | null {
  if (node.type === "function_declaration") return node.childForFieldName("name")?.text ?? null;
  const decl = node.parent;
  if (decl?.type === "variable_declarator") return decl.childForFieldName("name")?.text ?? null;
  if (decl?.type === "lexical_declaration") {
    for (const child of decl.namedChildren) {
      if (child.type === "variable_declarator") {
        return child.childForFieldName("name")?.text ?? null;
      }
    }
  }
  return null;
}

function detectExportType(node: TSNode, root: TSNode): ASTComponent["exportType"] {
  const parent = node.parent;
  if (!parent) return "none";
  if (parent.type === "export_statement" || parent.type === "export_default_declaration") {
    return parent.text.startsWith("export default") ? "default" : "named";
  }
  // Check if there's a matching `export default FunctionName` at top level
  return "none";
}

function nearestVariableDeclarator(node: TSNode): TSNode | null {
  let cur: TSNode | null = node.parent;
  while (cur) {
    if (cur.type === "variable_declarator") return cur;
    cur = cur.parent;
  }
  return null;
}

function extractObjectShapeFromCallback(node: TSNode): Record<string, string> {
  const shape: Record<string, string> = {};
  // Walk into the first arrow function argument's return object
  walkNode(node, (n) => {
    if (n.type === "pair" || n.type === "shorthand_property_identifier") {
      const key = n.childForFieldName("key")?.text ?? n.text;
      const value = n.childForFieldName("value");
      if (key && !["set", "get", "setState"].includes(key)) {
        shape[key] = value?.type ?? "unknown";
      }
    }
  });
  return shape;
}

function findDescendantByFieldOrType(node: TSNode | null | undefined, type: string): TSNode | null {
  if (!node) return null;
  for (const child of node.namedChildren) {
    if (child.type === type) return child;
    const found = findDescendantByFieldOrType(child, type);
    if (found) return found;
  }
  return null;
}

function sourceIndexFromPosition(source: string, row: number, col: number): number {
  const lines = source.split("\n");
  let idx = 0;
  for (let i = 0; i < row && i < lines.length; i++) {
    idx += lines[i].length + 1;
  }
  return idx + col;
}

function walkNode(node: TSNode, fn: (n: TSNode) => void): void {
  fn(node);
  for (const child of node.children) {
    walkNode(child, fn);
  }
}

function nodeSourceContains(node: TSNode, text: string): boolean {
  // Check if the node's source text contains a string — used for
  // detecting axios.create when callee is just "create"
  return node.text.includes(text);
}
