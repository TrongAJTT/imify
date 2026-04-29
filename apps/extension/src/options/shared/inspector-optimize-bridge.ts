let pendingInspectorOptimizeFile: File | null = null

export function setPendingInspectorOptimizeFile(file: File): void {
  pendingInspectorOptimizeFile = file
}

export function consumePendingInspectorOptimizeFile(): File | null {
  const next = pendingInspectorOptimizeFile
  pendingInspectorOptimizeFile = null
  return next
}
