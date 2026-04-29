export function getRouteId(
  searchParams: Record<string, string | string[] | undefined>,
  key = "id"
): string | null {
  const raw = searchParams[key]
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return /^[a-zA-Z0-9._:-]+$/.test(trimmed) ? trimmed : null
}
