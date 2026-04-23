import { useEffect, useState } from "react"
import { generateThumbnail } from "@/options/utils/thumbnail-generator"

/**
 * Custom hook to generate and manage thumbnail for a file.
 * Handles async generation and cleanup of thumbnail data URLs.
 *
 * @param file - The image file to create thumbnail for
 * @returns Object with thumbnail data URL and loading state
 */
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
