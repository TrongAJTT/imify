import { PDFDocument } from "pdf-lib"

import { calculateContainPlacement } from "@imify/core"
import { PAPER_DIMENSIONS } from "@imify/core/paper-constants"
import type { ResizeConfig } from "@imify/core/types"
import { convertRasterImage } from "./canvas-engine"

export interface PreparedImage {
  bytes: Uint8Array
  kind: "jpg" | "png"
  width?: number
  height?: number
}

function toPdfBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as unknown as BlobPart], {
    type: "application/pdf"
  })
}

export interface PdfConvertParams {
  sourceBlob: Blob
  resize: ResizeConfig
}

function getMimeKind(blob: Blob): "jpg" | "png" | "webp" | "avif" | null {
  if (blob.type === "image/jpeg" || blob.type === "image/jpg") {
    return "jpg"
  }

  if (blob.type === "image/png") {
    return "png"
  }

  if (blob.type === "image/webp") {
    return "webp"
  }

  if (blob.type === "image/avif") {
    return "avif"
  }

  return null
}

async function decodeToJpegForPdf(blob: Blob): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(blob)
  const width = bitmap.width
  const height = bitmap.height

  let jpegBlob: Blob

  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      bitmap.close()
      throw new Error("Unable to create OffscreenCanvas 2D context for PDF conversion")
    }
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
    jpegBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 })
  } else if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      bitmap.close()
      throw new Error("Unable to create Canvas 2D context for PDF conversion")
    }
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()
    jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (res) => (res ? resolve(res) : reject(new Error("Canvas toBlob failed"))),
        "image/jpeg",
        0.92
      )
    })
  } else {
    bitmap.close()
    throw new Error("No canvas implementation available for decoding image to PDF")
  }

  const bytes = new Uint8Array(await jpegBlob.arrayBuffer())
  return {
    bytes,
    kind: "jpg",
    width,
    height
  }
}

export async function prepareImageForPdf(params: PdfConvertParams): Promise<PreparedImage> {
  const sourceMime = getMimeKind(params.sourceBlob)
  const isPassthrough =
    (params.resize.mode as any) === "inherit" ||
    (params.resize.mode as any) === "none" ||
    (params.resize.mode as any) === "paper_size" ||
    (params.resize.mode as any) === "page_size"

  // Fast path A: Raw JPEG / PNG passthrough (Zero re-compression)
  if ((sourceMime === "jpg" || sourceMime === "png") && isPassthrough) {
    const bytes = new Uint8Array(await params.sourceBlob.arrayBuffer())
    return {
      bytes,
      kind: sourceMime
    }
  }

  // Fast path B: WebP / AVIF native decode to JPEG 92 without WASM overhead
  if ((sourceMime === "webp" || sourceMime === "avif") && isPassthrough) {
    try {
      return await decodeToJpegForPdf(params.sourceBlob)
    } catch {
      // Fallback to raster conversion pipeline if canvas decode fails
    }
  }

  // Generic fallback: resize & convert with quality 92
  const raster = await convertRasterImage({
    sourceBlob: params.sourceBlob,
    targetFormat: "jpg",
    resize: params.resize,
    quality: 92
  })

  return {
    bytes: new Uint8Array(await raster.outputBlob.arrayBuffer()),
    kind: "jpg",
    width: raster.width,
    height: raster.height
  }
}

export async function embedPreparedImageToDoc(
  pdfDoc: PDFDocument,
  prepared: PreparedImage,
  resize?: ResizeConfig
): Promise<void> {
  const embeddedImage =
    prepared.kind === "png"
      ? await pdfDoc.embedPng(prepared.bytes)
      : await pdfDoc.embedJpg(prepared.bytes)

  const imageWidth = prepared.width ?? embeddedImage.width
  const imageHeight = prepared.height ?? embeddedImage.height

  if (resize && ((resize.mode as any) === "paper_size" || (resize.mode as any) === "page_size")) {
    const paperSize = typeof resize.value === "string" ? resize.value : "A4"
    const page = PAPER_DIMENSIONS[paperSize]?.[72] ?? PAPER_DIMENSIONS.A4[72]
    const placement = calculateContainPlacement(
      imageWidth,
      imageHeight,
      page.width,
      page.height
    )

    const pdfPage = pdfDoc.addPage([page.width, page.height])
    pdfPage.drawImage(embeddedImage, {
      x: placement.offsetX,
      y: placement.offsetY,
      width: placement.drawWidth,
      height: placement.drawHeight
    })
  } else {
    const pdfPage = pdfDoc.addPage([imageWidth, imageHeight])
    pdfPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: imageWidth,
      height: imageHeight
    })
  }
}

export async function convertImageToPdf(params: PdfConvertParams): Promise<Blob> {
  const prepared = await prepareImageForPdf(params)
  const pdfDoc = await PDFDocument.create()
  await embedPreparedImageToDoc(pdfDoc, prepared, params.resize)
  const pdfBytes = await pdfDoc.save()
  return toPdfBlob(pdfBytes)
}

export async function mergeImagesToPdf(
  sourceBlobs: Blob[],
  onPageProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()
  const total = sourceBlobs.length

  for (let i = 0; i < total; i += 1) {
    const sourceBlob = sourceBlobs[i]!
    const prepared = await prepareImageForPdf({
      sourceBlob,
      resize: { mode: "inherit" }
    })
    await embedPreparedImageToDoc(pdfDoc, prepared)
    onPageProgress?.(i + 1, total)
  }

  const pdfBytes = await pdfDoc.save()
  return toPdfBlob(pdfBytes)
}
