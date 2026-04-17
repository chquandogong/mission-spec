// Architecture extractor — reads src/ and produces a derived, deterministic
// snapshot of modules, imports, exports, and the public API surface.
// Used by scripts/generate-architecture.js to detect drift between code
// and the .mission/architecture/ registry.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";

export interface ExtractedModule {
  id: string;
  path: string;
  layer: string;
  exports: string[];
  depends_on: string[];
}

export interface ExtractedEdge {
  from: string;
  to: string;
}

export interface ExtractedArchitecture {
  modules: ExtractedModule[];
  edges: ExtractedEdge[];
  public_api: {
    functions: string[];
    types: string[];
  };
}

interface RawModule {
  id: string;
  absPath: string;
  relPath: string;
  layer: string;
  exports: string[];
  typeExports: Set<string>;
  imports: { rawPath: string; isTypeOnly: boolean; names: string[] }[];
}

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkTsFiles(full, acc);
    } else if (
      name.endsWith(".ts") &&
      !name.endsWith(".d.ts") &&
      !name.endsWith(".test.ts")
    ) {
      acc.push(full);
    }
  }
  return acc;
}

function moduleIdFromPath(relPath: string): string {
  const base = relPath.replace(/^src\//, "").replace(/\.ts$/, "");
  const parts = base.split("/");
  return parts[parts.length - 1];
}

function layerFromPath(relPath: string): string {
  const parts = relPath.replace(/^src\//, "").split("/");
  if (parts.length < 2) return "root";
  return parts[0];
}

function extractExports(source: string): {
  values: string[];
  types: Set<string>;
} {
  const values: string[] = [];
  const types = new Set<string>();

  // Direct declarations: export (async) function/const/let/var/class NAME
  const directValueRe =
    /^export\s+(?:default\s+)?(?:async\s+)?(?:function|const|let|var|class)\s+(\w+)/gm;
  let m: RegExpExecArray | null;
  while ((m = directValueRe.exec(source))) {
    values.push(m[1]);
  }

  // Direct type declarations: export interface/type/enum NAME
  const directTypeRe = /^export\s+(?:interface|type|enum)\s+(\w+)/gm;
  while ((m = directTypeRe.exec(source))) {
    types.add(m[1]);
  }

  // Re-export groups: export { a, b } [from "..."]
  // and: export type { A, B } [from "..."]
  const groupRe =
    /^export\s+(type\s+)?\{([^}]+)\}(?:\s+from\s+["'][^"']+["'])?/gm;
  while ((m = groupRe.exec(source))) {
    const isType = Boolean(m[1]);
    const names = m[2]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        // Handle `a as b` — exported name is `b`
        const asMatch = s.match(/\s+as\s+(\w+)/);
        if (asMatch) return asMatch[1];
        // Handle inline `type Foo`
        const typeMatch = s.match(/^type\s+(\w+)/);
        if (typeMatch) {
          types.add(typeMatch[1]);
          return null;
        }
        return s.match(/^\w+/)?.[0] ?? null;
      })
      .filter((s): s is string => Boolean(s));

    for (const n of names) {
      if (isType) types.add(n);
      else values.push(n);
    }
  }

  return { values, types };
}

function extractReExportPaths(source: string): string[] {
  const paths: string[] = [];
  const re =
    /^export\s+(?:type\s+)?(?:\{[^}]*\}|\*)\s+from\s+["']([^"']+)["']/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    if (m[1].startsWith(".")) paths.push(m[1]);
  }
  return paths;
}

function extractImports(
  source: string,
): { rawPath: string; isTypeOnly: boolean; names: string[] }[] {
  const out: { rawPath: string; isTypeOnly: boolean; names: string[] }[] = [];
  // Matches: import [type] { ... } from "./path" | import x from "./path"
  const re =
    /^import\s+(type\s+)?(\{([^}]*)\}|\w[\w\d]*|\*\s+as\s+\w+)\s+from\s+["']([^"']+)["']/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const isTypeOnly = Boolean(m[1]);
    const rawPath = m[4];
    if (!rawPath.startsWith(".")) continue; // external module
    const groupBody = m[3];
    const names = groupBody
      ? groupBody
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => {
            const asMatch = s.match(/\s+as\s+(\w+)/);
            if (asMatch) return asMatch[1];
            return s.match(/^(?:type\s+)?(\w+)/)?.[1] ?? s;
          })
      : [m[2]];
    out.push({ rawPath, isTypeOnly, names });
  }
  return out;
}

function resolveImportToModuleId(
  rawPath: string,
  fromAbsPath: string,
  modulesByAbsPath: Map<string, RawModule>,
): string | null {
  const fromDir = dirname(fromAbsPath);
  const cleaned = rawPath.replace(/\.js$/, "");
  const candidates = [
    resolve(fromDir, cleaned + ".ts"),
    resolve(fromDir, cleaned, "index.ts"),
  ];
  for (const candidate of candidates) {
    const mod = modulesByAbsPath.get(candidate);
    if (mod) return mod.id;
  }
  return null;
}

export function extractArchitecture(projectDir: string): ExtractedArchitecture {
  const srcDir = join(projectDir, "src");
  const absFiles = walkTsFiles(srcDir);

  const raw: RawModule[] = absFiles.map((absPath) => {
    const relPath = relative(projectDir, absPath).replace(/\\/g, "/");
    const source = readFileSync(absPath, "utf-8");
    const { values, types } = extractExports(source);
    const imports = extractImports(source);
    for (const rawPath of extractReExportPaths(source)) {
      imports.push({ rawPath, isTypeOnly: false, names: [] });
    }
    return {
      id: moduleIdFromPath(relPath),
      absPath,
      relPath,
      layer: layerFromPath(relPath),
      exports: values,
      typeExports: types,
      imports,
    };
  });

  const modulesByAbsPath = new Map<string, RawModule>();
  for (const m of raw) modulesByAbsPath.set(m.absPath, m);

  const edges: ExtractedEdge[] = [];
  const modules: ExtractedModule[] = raw
    .map((m) => {
      const deps = new Set<string>();
      for (const imp of m.imports) {
        const targetId = resolveImportToModuleId(
          imp.rawPath,
          m.absPath,
          modulesByAbsPath,
        );
        if (targetId && targetId !== m.id) {
          deps.add(targetId);
          edges.push({ from: m.id, to: targetId });
        }
      }
      const mergedExports = [
        ...new Set([...m.exports, ...m.typeExports]),
      ].sort();
      return {
        id: m.id,
        path: m.relPath,
        layer: m.layer,
        exports: mergedExports,
        depends_on: [...deps].sort(),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const dedupedEdges = [
    ...new Map(edges.map((e) => [`${e.from}>${e.to}`, e])).values(),
  ].sort((a, b) => {
    const byFrom = a.from.localeCompare(b.from);
    return byFrom !== 0 ? byFrom : a.to.localeCompare(b.to);
  });

  const indexMod = raw.find((m) => m.relPath === "src/index.ts");
  const public_api = {
    functions: indexMod ? [...indexMod.exports].sort() : [],
    types: indexMod ? [...indexMod.typeExports].sort() : [],
  };

  return { modules, edges: dedupedEdges, public_api };
}
