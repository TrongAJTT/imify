export interface DecodeImageBitmapOptions {
  colorSpaceConversion?: ColorSpaceConversion
  premultiplyAlpha?: PremultiplyAlpha
}

const DEFAULT_DECODE_OPTIONS: DecodeImageBitmapOptions = {
  // Let browser run colorimetric conversion into display-safe pipeline values.
  colorSpaceConversion: "default",
  premultiplyAlpha: "none"
}

export interface DecodedImageSource {
  image: CanvasImageSource
  width: number
  height: number
  close: () => void
}

export async function decodeImageSourceForEncoding(
  sourceBlob: Blob,
  options?: DecodeImageBitmapOptions
): Promise<DecodedImageSource> {
  // Eagerly materialise bytes to detach from any Android content:// URI reference.
  let activeBlob = sourceBlob
  try {
    const buffer = await sourceBlob.arrayBuffer()
    activeBlob = new Blob([buffer], { type: sourceBlob.type || "image/jpeg" })
  } catch {
    // use original blob if read fails
  }

  const decodeOptions: ImageBitmapOptions = {
    ...DEFAULT_DECODE_OPTIONS,
    ...(options ?? {})
  }

  // Try standard createImageBitmap first
  try {
    const bitmap = await createImageBitmap(activeBlob, decodeOptions)
    return {
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close()
    }
  } catch (nativeError) {
    // Fallback: If we are on the main thread, use HTMLImageElement directly.
    // This completely bypasses createImageBitmap and avoids VRAM/Vulkan allocation issues on Android.
    if (typeof document !== "undefined" && typeof window !== "undefined") {
      try {
        return await new Promise<DecodedImageSource>((resolve, reject) => {
          const url = URL.createObjectURL(activeBlob)
          const img = new window.Image()
          img.onload = () => {
            resolve({
              image: img,
              width: img.naturalWidth,
              height: img.naturalHeight,
              close: () => URL.revokeObjectURL(url)
            })
          }
          img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error("HTMLImageElement fallback decoding failed"))
          }
          img.src = url
        })
      } catch (fallbackError) {
        console.warn("HTMLImageElement fallback failed", fallbackError)
      }
    }

    // Bare fallback createImageBitmap call if not in browser context
    const bitmap = await createImageBitmap(activeBlob)
    return {
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close()
    }
  }
}

export async function decodeImageBitmapForEncoding(
  sourceBlob: Blob,
  options?: DecodeImageBitmapOptions
): Promise<ImageBitmap> {
  const result = await decodeImageSourceForEncoding(sourceBlob, options)
  return result.image as ImageBitmap
}


export function getOffscreen2DContext(canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D | null {
  const preferred = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: true,
    colorSpace: "srgb"
  })

  if (preferred) {
    return preferred
  }

  return canvas.getContext("2d")
}
