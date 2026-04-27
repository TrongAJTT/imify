export interface DecodeImageBitmapOptions {
  colorSpaceConversion?: ColorSpaceConversion
  premultiplyAlpha?: PremultiplyAlpha
}

const DEFAULT_DECODE_OPTIONS: DecodeImageBitmapOptions = {
  // Let browser run colorimetric conversion into display-safe pipeline values.
  colorSpaceConversion: "default",
  premultiplyAlpha: "none"
}

export async function decodeImageBitmapForEncoding(
  sourceBlob: Blob,
  options?: DecodeImageBitmapOptions
): Promise<ImageBitmap> {
  const decodeOptions: ImageBitmapOptions = {
    ...DEFAULT_DECODE_OPTIONS,
    ...(options ?? {})
  }

  try {
    return await createImageBitmap(sourceBlob, decodeOptions)
  } catch {
    // Fallback for runtimes that do not support all ImageBitmap options.
    return await createImageBitmap(sourceBlob)
  }
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
