import { useEffect, useState } from "react"

const THUMBNAIL_MAX_WIDTH = 200
const THUMBNAIL_QUALITY = 0.6

async function generateThumbnail(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) {
    return null
  }
  try {
    const bitmap = await createImageBitmap(file, {
      resizeWidth: THUMBNAIL_MAX_WIDTH,
      resizeQuality: "low"
    })
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      bitmap.close()
      return null
    }
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
    const blob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: THUMBNAIL_QUALITY
    })
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export function useThumbnail(file: File | null) {
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!file) {
      setThumbnail(null)
      setIsLoading(false)
      setError(null)
      return
    }
    let isMounted = true
    setIsLoading(true)
    setError(null)
    generateThumbnail(file)
      .then((url) => {
        if (isMounted) {
          setThumbnail(url)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to generate thumbnail"))
          setIsLoading(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [file])

  return { thumbnail, isLoading, error }
}
