export interface ImageDimensions {
  width: number
  height: number
}

export interface SmartNameContext {
  pattern: string
  originalFileName: string
  outputExtension: string
  index: number
  totalFiles?: number
  dimensions: ImageDimensions | null
  now: Date
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0")
}

function safeSegment(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function baseNameFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "") || "image"
}

export function buildSmartOutputFileName(context: SmartNameContext): string {
  const { pattern, originalFileName, outputExtension, index, totalFiles, dimensions, now } = context
  const normalizedPattern = pattern.trim() || "[OriginalName]_[Index].[Ext]"
  const date = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`
  const time = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`

  // Calculate Zero-padding (Zero-padded Index)
  // Term: "Natural Padding" or "Dynamic Padding" based on total file count
  const paddingSize = totalFiles ? String(totalFiles).length : 3
  const paddedIndex = String(index).padStart(Math.max(paddingSize, 2), "0")

  const replacements: Record<string, string> = {
    "[OriginalName]": safeSegment(baseNameFromFileName(originalFileName)) || "image",
    "[Width]": dimensions ? String(Math.round(dimensions.width)) : "unknown-width",
    "[Height]": dimensions ? String(Math.round(dimensions.height)) : "unknown-height",
    "[Date]": date,
    "[Time]": time,
    "[Index]": String(index),
    "[PaddedIndex]": paddedIndex,
    "[Ext]": outputExtension.replace(/^\./, "")
  }

  const replaced = Object.entries(replacements).reduce((acc, [token, value]) => {
    return acc.split(token).join(value)
  }, normalizedPattern)

  const sanitized = safeSegment(replaced.replace(/\.[^.]+$/, "")) || "output"
  return `${sanitized}.${outputExtension.replace(/^\./, "")}`
}

export async function readImageDimensions(sourceBlob: Blob): Promise<ImageDimensions | null> {
  if (!sourceBlob.type.startsWith("image/")) {
    return null
  }

  try {
    const bitmap = await createImageBitmap(sourceBlob)

    try {
      return {
        width: bitmap.width,
        height: bitmap.height
      }
    } finally {
      bitmap.close()
    }
  } catch {
    return null
  }
}
