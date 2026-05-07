/**
 * Utility functions for formatting data.
 */

/**
 * Formats a size in bytes into a human-readable string (e.g. 1.2 MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return `${size < 10 ? size.toFixed(2) : size < 100 ? size.toFixed(1) : Math.round(size)} ${units[i]}`
}
