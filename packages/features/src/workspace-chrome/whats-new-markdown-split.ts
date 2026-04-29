// Marker is stored inside `assets/WHATS_NEW.md`.
// Be defensive: allow leading/trailing whitespace so we don't accidentally fail
// when the fetched markdown has different formatting/line endings.
const WHATS_NEW_SUMMARY_MARKER = /^\s*---\s+SUMMARY ABOVE\s*$/m

function splitWhatsNewMarkdown(markdown: string): { summaryAbove: string; bodyBelow: string } {
  if (!markdown) {
    return { summaryAbove: "", bodyBelow: "" }
  }

  const match = WHATS_NEW_SUMMARY_MARKER.exec(markdown)
  if (!match || typeof match.index !== "number") {
    return { summaryAbove: markdown, bodyBelow: "" }
  }

  const summaryAboveRaw = markdown.slice(0, match.index)
  const summaryAbove = summaryAboveRaw.trimEnd()

  // `match[0]` is exactly the marker line (no newline). Remove the marker line,
  // then trim away the first newline(s) after it.
  let bodyBelowRaw = markdown.slice(match.index + match[0].length)
  bodyBelowRaw = bodyBelowRaw.replace(/^\s*\r?\n/, "")
  const bodyBelow = bodyBelowRaw.trimStart()

  return { summaryAbove, bodyBelow }
}

export function extractWhatsNewSummaryAbove(markdown: string): string {
  return splitWhatsNewMarkdown(markdown).summaryAbove
}

export function extractWhatsNewBodyBelowSummary(markdown: string): string {
  return splitWhatsNewMarkdown(markdown).bodyBelow
}

