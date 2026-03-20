import { PDFDocument } from "pdf-lib"

import { calculateContainPlacement } from "@/core/image-utils"
import { PAPER_DIMENSIONS } from "@/core/paper-constants"
import type { ResizeConfig } from "@/core/types"
import { convertRasterImage } from "@/features/converter/canvas-engine"

interface PreparedImage {
  bytes: Uint8Array
  kind: "jpg" | "png"
  width?: number
  height?: number
}

export interface PdfConvertParams {
  sourceBlob: Blob
  resize: ResizeConfig
}

function getMimeKind(blob: Blob): "jpg" | "png" | null {
  if (blob.type === "image/jpeg" || blob.type === "image/jpg") {
    return "jpg"
  }

  if (blob.type === "image/png") {
    return "png"
  }

  return null
}

async function prepareImageForPdf(params: PdfConvertParams): Promise<PreparedImage> {
  const sourceMime = getMimeKind(params.sourceBlob)

  if (sourceMime && (params.resize.mode === "none" || params.resize.mode === "page_size")) {
    const bytes = new Uint8Array(await params.sourceBlob.arrayBuffer())

    return {
      bytes,
      kind: sourceMime
    }
  }

  const raster = await convertRasterImage({
    sourceBlob: params.sourceBlob,
    targetFormat: "jpg",
    resize: params.resize,
    quality: 100
  })

  return {
    bytes: new Uint8Array(await raster.outputBlob.arrayBuffer()),
    kind: "jpg",
    width: raster.width,
    height: raster.height
  }
}

export async function convertImageToPdf(params: PdfConvertParams): Promise<Blob> {
  const prepared = await prepareImageForPdf(params)
  const pdfDoc = await PDFDocument.create()

  const embeddedImage =
    prepared.kind === "png"
      ? await pdfDoc.embedPng(prepared.bytes)
      : await pdfDoc.embedJpg(prepared.bytes)

  const imageWidth = prepared.width ?? embeddedImage.width
  const imageHeight = prepared.height ?? embeddedImage.height

  if (params.resize.mode === "page_size") {
    const paperSize = typeof params.resize.value === "string" ? params.resize.value : "A4"
    const page = PAPER_DIMENSIONS[paperSize][72]
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

  const pdfBytes = await pdfDoc.save()

  return new Blob([pdfBytes as Uint8Array<ArrayBuffer>], {
    type: "application/pdf"
  })
}

export async function mergeImagesToPdf(sourceBlobs: Blob[]): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()

  for (const sourceBlob of sourceBlobs) {
    const prepared = await prepareImageForPdf({
      sourceBlob,
      resize: { mode: "none" }
    })

    const embeddedImage =
      prepared.kind === "png"
        ? await pdfDoc.embedPng(prepared.bytes)
        : await pdfDoc.embedJpg(prepared.bytes)

    const imageWidth = prepared.width ?? embeddedImage.width
    const imageHeight = prepared.height ?? embeddedImage.height
    const page = pdfDoc.addPage([imageWidth, imageHeight])

    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: imageWidth,
      height: imageHeight
    })
  }

  const pdfBytes = await pdfDoc.save()

  return new Blob([pdfBytes as Uint8Array<ArrayBuffer>], {
    type: "application/pdf"
  })
}
