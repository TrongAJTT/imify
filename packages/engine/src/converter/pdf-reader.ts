export interface RenderPdfPageOptions {
  pageNumber: number // 1-indexed
  dpi?: number
  format?: "png" | "jpg" | "webp"
  quality?: number
}

export interface PdfDocumentInfo {
  pageCount: number
  fingerprint: string
}

let pdfjsLibPromise: Promise<typeof import("pdfjs-dist")> | null = null

async function getPdfjsLib() {
  if (typeof window === "undefined") {
    throw new Error("PDF processing with pdfjs-dist is only supported in browser environments")
  }

  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist").then((lib) => {
      if (!lib.GlobalWorkerOptions.workerSrc) {
        lib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${lib.version || "6.2.108"}/build/pdf.worker.min.mjs`
      }
      return lib
    })
  }

  return pdfjsLibPromise
}

async function toUint8Array(source: Blob | ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  if (source instanceof Uint8Array) {
    return source
  }
  if (source instanceof ArrayBuffer) {
    return new Uint8Array(source)
  }
  return new Uint8Array(await source.arrayBuffer())
}

export async function getPdfInfo(source: Blob | ArrayBuffer | Uint8Array): Promise<PdfDocumentInfo> {
  const pdfjsLib = await getPdfjsLib()
  const data = await toUint8Array(source)
  const loadingTask = pdfjsLib.getDocument({ data })
  const pdfDoc = await loadingTask.promise

  return {
    pageCount: pdfDoc.numPages,
    fingerprint: pdfDoc.fingerprints?.[0] ?? ""
  }
}

export async function renderPdfPageToCanvas(
  source: Blob | ArrayBuffer | Uint8Array,
  pageNumber: number,
  dpi: number = 150
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const pdfjsLib = await getPdfjsLib()
  const data = await toUint8Array(source)
  const loadingTask = pdfjsLib.getDocument({ data })
  const pdfDoc = await loadingTask.promise

  if (pageNumber < 1 || pageNumber > pdfDoc.numPages) {
    throw new Error(`Page number ${pageNumber} is out of range (1 - ${pdfDoc.numPages})`)
  }

  const page = await pdfDoc.getPage(pageNumber)
  // Standard PDF resolution is 72 DPI
  const scale = dpi / 72
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement("canvas")
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Failed to get 2D canvas context for PDF rendering")
  }

  // Fill white background for pages that don't specify background color
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const renderContext = {
    canvas,
    canvasContext: ctx as any,
    viewport
  }

  await (page.render(renderContext as any) as any).promise

  return {
    canvas,
    width: canvas.width,
    height: canvas.height
  }
}

export async function renderPdfPageToBlob(
  source: Blob | ArrayBuffer | Uint8Array,
  options: RenderPdfPageOptions
): Promise<Blob> {
  const { pageNumber, dpi = 150, format = "png", quality = 0.92 } = options
  const { canvas } = await renderPdfPageToCanvas(source, pageNumber, dpi)

  const mimeType =
    format === "jpg"
      ? "image/jpeg"
      : format === "webp"
        ? "image/webp"
        : "image/png"

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error(`Failed to convert canvas to ${mimeType} blob`))
        }
      },
      mimeType,
      quality
    )
  })
}

export async function renderAllPdfPagesToBlobs(
  source: Blob | ArrayBuffer | Uint8Array,
  options: {
    dpi?: number
    format?: "png" | "jpg" | "webp"
    quality?: number
    pageNumbers?: number[] // If omitted, renders all pages
    onProgress?: (current: number, total: number) => void
  }
): Promise<Array<{ pageNumber: number; blob: Blob }>> {
  const pdfjsLib = await getPdfjsLib()
  const data = await toUint8Array(source)
  const loadingTask = pdfjsLib.getDocument({ data })
  const pdfDoc = await loadingTask.promise
  const totalPages = pdfDoc.numPages

  const pagesToRender = options.pageNumbers && options.pageNumbers.length > 0
    ? options.pageNumbers.filter((p) => p >= 1 && p <= totalPages)
    : Array.from({ length: totalPages }, (_, i) => i + 1)

  const results: Array<{ pageNumber: number; blob: Blob }> = []
  const count = pagesToRender.length

  for (let i = 0; i < count; i += 1) {
    const pageNum = pagesToRender[i]!
    const blob = await renderPdfPageToBlob(data, {
      pageNumber: pageNum,
      dpi: options.dpi,
      format: options.format,
      quality: options.quality
    })

    results.push({ pageNumber: pageNum, blob })
    options.onProgress?.(i + 1, count)
  }

  return results
}
