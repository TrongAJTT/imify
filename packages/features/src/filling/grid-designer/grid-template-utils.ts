import type { GridPrimaryDirection } from "../types";

export interface ParsedGridTemplate {
  direction: GridPrimaryDirection;
  definitions: string[];
}

/**
 * Parses a template string (e.g. "R:1:-:-", "C:1 2:-:-:3", "R:1:1:1")
 * into a direction ("rows" | "cols") and an expanded list of definitions where "-" is replaced
 * with the preceding non-hyphen definition.
 */
export function parseGridTemplateString(
  templateStr: string | null | undefined,
): ParsedGridTemplate {
  if (!templateStr || typeof templateStr !== "string") {
    return {
      direction: "rows",
      definitions: ["3", "3", "3"],
    };
  }

  const trimmed = templateStr.trim();
  if (!trimmed) {
    return {
      direction: "rows",
      definitions: ["3", "3", "3"],
    };
  }

  const parts = trimmed.split(":");
  let direction: GridPrimaryDirection = "rows";
  let rawDefs: string[] = [];

  const firstUpper = parts[0].toUpperCase().trim();
  if (firstUpper === "R" || firstUpper === "ROWS") {
    direction = "rows";
    rawDefs = parts.slice(1);
  } else if (firstUpper === "C" || firstUpper === "COLS" || firstUpper === "COLUMNS") {
    direction = "cols";
    rawDefs = parts.slice(1);
  } else {
    // If no prefix is present, treat entire string or parts as row definitions
    direction = "rows";
    rawDefs = parts;
  }

  if (rawDefs.length === 0) {
    return {
      direction,
      definitions: ["3", "3", "3"],
    };
  }

  const definitions: string[] = [];
  let lastResolved = "1";

  for (let i = 0; i < rawDefs.length; i++) {
    const item = rawDefs[i].trim();
    if (item === "-") {
      definitions.push(lastResolved);
    } else {
      const resolved = item || "1";
      definitions.push(resolved);
      lastResolved = resolved;
    }
  }

  return {
    direction,
    definitions,
  };
}

/**
 * Serializes a direction and definitions array into a compact template string
 * (e.g. direction: "rows", defs: ["1", "1", "1"] => "R:1:-:-").
 */
export function deparseGridTemplate(
  direction: GridPrimaryDirection,
  definitions: string[],
): string {
  const prefix = direction === "cols" ? "C" : "R";
  if (!definitions || definitions.length === 0) {
    return `${prefix}:3:-:-`;
  }

  const resultParts: string[] = [];
  let previousDef: string | null = null;

  for (let i = 0; i < definitions.length; i++) {
    const def = definitions[i].trim();
    if (i > 0 && def === previousDef) {
      resultParts.push("-");
    } else {
      resultParts.push(def);
      previousDef = def;
    }
  }

  return `${prefix}:${resultParts.join(":")}`;
}
