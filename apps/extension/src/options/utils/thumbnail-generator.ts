/**
 * Thumbnail generator using createImageBitmap for memory-efficient rendering.
 * Generates low-quality thumbnails suitable for grid display without loading full-resolution images.
 */

const THUMBNAIL_MAX_WIDTH = 200
const THUMBNAIL_QUALITY = 0.6

/**
 * Generate a memory-efficient thumbnail from a file using createImageBitmap.
 * This approach avoids loading the full resolution image into memory.
 *
 * @param file - The image file to create a thumbnail from
 * @returns Data URL of the thumbnail, or null if generation fails
 */
export async function generateThumbnail(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) {
    return null
  }

  try {
    // Use createImageBitmap with resizeWidth for automatic downscaling
    // This is more efficient than loading full image then scaling via canvas
    const bitmap = await createImageBitmap(file, {
      resizeWidth: THUMBNAIL_MAX_WIDTH,
      resizeQuality: "low" // Prioritize speed and memory over quality
    })

    // Create an offscreen canvas to draw the small bitmap
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      bitmap.close()
      return null
    }

    // Draw the bitmap to canvas
    ctx.drawImage(bitmap, 0, 0)

    // Clean up bitmap resource
    bitmap.close()

    // Convert to low-quality JPEG for minimal data size
    const blob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: THUMBNAIL_QUALITY
    })

    // Convert blob to Data URL
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("Failed to generate thumbnail:", error)
    return null
  }
}

/**
 * Batch generate thumbnails with progress callback.
 * Processes files sequentially to avoid memory spikes.
 *
 * @param files - Array of image files
 * @param onProgress - Optional callback for progress updates
 * @returns Map of file name to thumbnail Data URL
 */
export async function generateThumbnailBatch(
  files: File[],
  onProgress?: (processed: number, total: number) => void
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>()

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const thumbnail = await generateThumbnail(file)
    results.set(file.name, thumbnail)

    onProgress?.(i + 1, files.length)
  }

  return results
}
