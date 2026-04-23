export function applyThemeClass(isDark: boolean): void {
  document.documentElement.classList.toggle("dark", isDark)
}

export function parseDarkModeValue(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") return true
    if (normalized === "false") return false
  }

  if (typeof value === "number") {
    return value === 1
  }

  return Boolean(value)
}
