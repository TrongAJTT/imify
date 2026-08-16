import { useEffect, useRef, useState } from "react";

const THUMBNAIL_MAX_WIDTH = 200;
const THUMBNAIL_QUALITY = 0.6;

async function generateThumbnailBlob(file: File): Promise<Blob | null> {
  if (!file.type.startsWith("image/")) {
    return null;
  }
  try {
    const bitmap = await createImageBitmap(file, {
      resizeWidth: THUMBNAIL_MAX_WIDTH,
      resizeQuality: "low",
    });
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: THUMBNAIL_QUALITY,
    });
    return blob;
  } catch {
    return null;
  }
}

export function useThumbnail(file: File | null) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!file) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setThumbnail(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // Initial instant fallback to original file ObjectURL while thumbnail is generated
    const directUrl = URL.createObjectURL(file);
    if (!thumbnail) {
      setThumbnail(directUrl);
    }

    generateThumbnailBlob(file)
      .then((blob) => {
        if (!isMounted) {
          URL.revokeObjectURL(directUrl);
          return;
        }

        if (blob) {
          const thumbUrl = URL.createObjectURL(blob);
          if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
          }
          URL.revokeObjectURL(directUrl);
          objectUrlRef.current = thumbUrl;
          setThumbnail(thumbUrl);
        } else {
          objectUrlRef.current = directUrl;
          setThumbnail(directUrl);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (isMounted) {
          objectUrlRef.current = directUrl;
          setThumbnail(directUrl);
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to generate thumbnail"),
          );
          setIsLoading(false);
        } else {
          URL.revokeObjectURL(directUrl);
        }
      });

    return () => {
      isMounted = false;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [file]);

  return { thumbnail, isLoading, error };
}
