export function isMemoryPressureError(error: unknown): boolean {
  if (error instanceof RangeError) {
    return true
  }

  if (!(error instanceof Error)) {
    return false
  }

  const msg = error.message.toLowerCase()

  return (
    msg.includes("out of memory") ||
    msg.includes("memory") ||
    msg.includes("allocation") ||
    msg.includes("invalid array length") ||
    msg.includes("canvas area exceeds") ||
    msg.includes("insufficient")
  )
}

export function toUserFacingConversionError(error: unknown, fallback: string): string {
  if (isMemoryPressureError(error)) {
    return "Not enough memory to process this image. Try smaller files, lower DPI/quality, or lower batch concurrency."
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}