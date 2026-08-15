/**
 * Parse a human-friendly page range string into a Set of 1-indexed page numbers.
 * Examples:
 *   "1-5, 8, 11-14" -> Set {1, 2, 3, 4, 5, 8, 11, 12, 13, 14}
 *   "even" -> Set of even pages
 *   "odd" -> Set of odd pages
 *   "all" -> Set of all pages 1..totalPages
 */
export function parsePageRange(rangeStr: string, totalPages: number): Set<number> {
  const result = new Set<number>();
  if (!rangeStr || totalPages <= 0) return result;

  const normalized = rangeStr.trim().toLowerCase();

  if (normalized === "all" || normalized === "*") {
    for (let i = 1; i <= totalPages; i += 1) result.add(i);
    return result;
  }

  if (normalized === "even") {
    for (let i = 2; i <= totalPages; i += 2) result.add(i);
    return result;
  }

  if (normalized === "odd") {
    for (let i = 1; i <= totalPages; i += 2) result.add(i);
    return result;
  }

  const parts = rangeStr.split(/[,;\s]+/).filter(Boolean);

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr || "", 10);
      const end = parseInt(endStr || "", 10);

      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let p = from; p <= to; p += 1) {
          result.add(p);
        }
      } else if (!Number.isNaN(start) && Number.isNaN(end)) {
        // e.g. "5-" -> 5 to totalPages
        const from = Math.max(1, Math.min(start, totalPages));
        for (let p = from; p <= totalPages; p += 1) {
          result.add(p);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!Number.isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        result.add(pageNum);
      }
    }
  }

  return result;
}

/**
 * Format a collection of 1-indexed page numbers into a compact human-friendly range string.
 * Examples:
 *   [1, 2, 3, 5, 7, 8, 9] -> "1-3, 5, 7-9"
 *   [1, 3, 5] -> "1, 3, 5"
 */
export function formatPageRange(pages: Set<number> | number[], totalPages?: number): string {
  const sorted = Array.from(pages)
    .filter((n) => Number.isInteger(n) && n >= 1 && (!totalPages || n <= totalPages))
    .sort((a, b) => a - b);

  if (sorted.length === 0) return "";

  const chunks: string[] = [];
  let rangeStart = sorted[0]!;
  let prev = sorted[0]!;

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i]!;
    if (current === prev + 1) {
      prev = current;
    } else {
      if (rangeStart === prev) {
        chunks.push(`${rangeStart}`);
      } else if (prev === rangeStart + 1) {
        chunks.push(`${rangeStart}, ${prev}`);
      } else {
        chunks.push(`${rangeStart}-${prev}`);
      }
      rangeStart = current;
      prev = current;
    }
  }

  // Flush the last range
  if (rangeStart === prev) {
    chunks.push(`${rangeStart}`);
  } else if (prev === rangeStart + 1) {
    chunks.push(`${rangeStart}, ${prev}`);
  } else {
    chunks.push(`${rangeStart}-${prev}`);
  }

  return chunks.join(", ");
}
