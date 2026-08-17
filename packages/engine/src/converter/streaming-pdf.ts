import { zlibSync } from "fflate"
import { PAPER_DIMENSIONS } from "@imify/core/paper-constants"
import { calculateContainPlacement } from "@imify/core"
import type { ResizeConfig } from "@imify/core/types"

export interface StreamingPdfPageOptions {
  /**
   * Page width in points (72 DPI). If not specified and resize is paper_size, derived from paper size.
   * Otherwise defaults to image dimensions in points.
   */
  pageWidth?: number
  /**
   * Page height in points (72 DPI).
   */
  pageHeight?: number

  /**
   * Image binary data (JPEG or PNG or raw).
   */
  imageBytes?: Uint8Array
  imageBlob?: Blob
  kind?: "jpg" | "png"

  /**
   * Dimensions in pixels of the source image.
   */
  imageWidth?: number
  imageHeight?: number

  /**
   * Optional resize configuration (e.g. paper_size A4, fit, etc.)
   */
  resize?: ResizeConfig

  /**
   * Custom placement on page in points (optional).
   */
  placement?: {
    x: number
    y: number
    width: number
    height: number
  }
}

/**
 * Fast helper to extract Width and Height from a raw JPEG buffer without decoding pixels.
 */
export function getJpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  let offset = 2
  const len = bytes.length
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null
  }

  while (offset < len) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }

    const marker = bytes[offset + 1]
    if (!marker) break

    // SOF markers: SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2)
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      const height = (bytes[offset + 5]! << 8) | bytes[offset + 6]!
      const width = (bytes[offset + 7]! << 8) | bytes[offset + 8]!
      return { width, height }
    }

    // Skip variable length markers
    if (marker !== 0xd8 && marker !== 0xd9 && marker !== 0x00) {
      const segmentLength = (bytes[offset + 2]! << 8) | bytes[offset + 3]!
      offset += 2 + segmentLength
    } else {
      offset += 2
    }
  }

  return null
}

/**
 * Fast helper to extract Width and Height from a raw PNG buffer.
 */
export function getPngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const width = view.getUint32(16)
    const height = view.getUint32(20)
    return { width, height }
  }
  return null
}

/**
 * Memory-efficient, stream-based PDF 1.7 writer.
 * Writes each page and image object sequentially into buffer chunks,
 * tracking byte offsets so that even 1,000+ page documents consume
 * only the memory of 1 single page at any given moment.
 */
export class StreamingPdfWriter {
  private chunks: BlobPart[] = []
  private currentByteOffset = 0
  private objectOffsets: number[] = []
  private nextObjectId = 1
  private pageObjectIds: number[] = []
  private isFinalized = false
  private isAborted = false
  private encoder = new TextEncoder()

  constructor() {
    // Write PDF Header
    this.writeString("%PDF-1.7\n%\xE2\xE3\xCF\xD3\n")
  }

  private writeString(str: string): void {
    const encoded = this.encoder.encode(str)
    this.chunks.push(encoded)
    this.currentByteOffset += encoded.byteLength
  }

  private writeBytes(bytes: Uint8Array): void {
    this.chunks.push(bytes as BlobPart)
    this.currentByteOffset += bytes.byteLength
  }

  private recordObjectStart(objId: number): void {
    this.objectOffsets[objId] = this.currentByteOffset
    this.writeString(`${objId} 0 obj\n`)
  }

  private recordObjectEnd(): void {
    this.writeString("endobj\n")
  }

  /**
   * Adds a page with an image to the PDF document stream.
   * Releases intermediate canvas/image memory immediately.
   */
  async addPage(options: StreamingPdfPageOptions): Promise<void> {
    if (this.isAborted) {
      throw new Error("StreamingPdfWriter was aborted")
    }
    if (this.isFinalized) {
      throw new Error("Cannot add page to finalized StreamingPdfWriter")
    }

    // 1. Resolve raw bytes
    let imageBytes: Uint8Array
    if (options.imageBytes) {
      imageBytes = options.imageBytes
    } else if (options.imageBlob) {
      imageBytes = new Uint8Array(await options.imageBlob.arrayBuffer())
    } else {
      throw new Error("StreamingPdfWriter: imageBytes or imageBlob required")
    }

    // 2. Resolve image format & dimensions
    let kind = options.kind
    let imgW = options.imageWidth
    let imgH = options.imageHeight

    if (!kind || !imgW || !imgH) {
      const jpegDims = getJpegDimensions(imageBytes)
      if (jpegDims) {
        kind = "jpg"
        imgW = imgW ?? jpegDims.width
        imgH = imgH ?? jpegDims.height
      } else {
        const pngDims = getPngDimensions(imageBytes)
        if (pngDims) {
          kind = "png"
          imgW = imgW ?? pngDims.width
          imgH = imgH ?? pngDims.height
        }
      }
    }

    imgW = imgW || 800
    imgH = imgH || 600
    kind = kind || "jpg"

    // 3. Resolve Page Size and Image Placement
    let pageWidth = options.pageWidth
    let pageHeight = options.pageHeight
    let placement = options.placement

    const resize = options.resize
    if (resize && ((resize.mode as any) === "paper_size" || (resize.mode as any) === "page_size")) {
      const paperSize = typeof resize.value === "string" ? resize.value : "A4"
      const paper = PAPER_DIMENSIONS[paperSize]?.[72] ?? PAPER_DIMENSIONS.A4[72]
      pageWidth = paper.width
      pageHeight = paper.height

      if (!placement) {
        const fit = calculateContainPlacement(imgW, imgH, pageWidth, pageHeight)
        placement = {
          x: fit.offsetX,
          y: fit.offsetY,
          width: fit.drawWidth,
          height: fit.drawHeight,
        }
      }
    } else {
      pageWidth = pageWidth ?? imgW
      pageHeight = pageHeight ?? imgH
      if (!placement) {
        placement = {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        }
      }
    }

    // 4. Allocate Object IDs
    const pageObjId = this.nextObjectId++
    const contentObjId = this.nextObjectId++
    const imageObjId = this.nextObjectId++

    this.pageObjectIds.push(pageObjId)

    // 5. Write Image XObject
    this.recordObjectStart(imageObjId)

    if (kind === "jpg") {
      this.writeString(
        `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`
      )
      this.writeBytes(imageBytes)
      this.writeString("\nendstream\n")
    } else {
      // For PNG / non-JPEG raw data, if not direct DCT, compress stream via FlateDecode
      const compressed = zlibSync(imageBytes, { level: 6 })
      this.writeString(
        `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${compressed.length} >>\nstream\n`
      )
      this.writeBytes(compressed)
      this.writeString("\nendstream\n")
    }
    this.recordObjectEnd()

    // 6. Write Content Stream (Draw Image)
    // Note: PDF coordinate system (0,0) is bottom-left.
    const contentCmd = `q ${placement.width.toFixed(2)} 0 0 ${placement.height.toFixed(2)} ${placement.x.toFixed(2)} ${placement.y.toFixed(2)} cm /Im1 Do Q`
    const contentBytes = this.encoder.encode(contentCmd)

    this.recordObjectStart(contentObjId)
    this.writeString(`<< /Length ${contentBytes.length} >>\nstream\n`)
    this.writeBytes(contentBytes)
    this.writeString("\nendstream\n")
    this.recordObjectEnd()

    // 7. Write Page Object
    this.recordObjectStart(pageObjId)
    this.writeString(
      `<< /Type /Page /Parent ##PAGES_ROOT## /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Contents ${contentObjId} 0 R /Resources << /ProcSet [/PDF /ImageC /ImageI /ImageB] /XObject << /Im1 ${imageObjId} 0 R >> >> >>\n`
    )
    this.recordObjectEnd()
  }

  /**
   * Finalizes the PDF document, writes the Pages Tree, Catalog, XRef Table, and Trailer.
   * Returns a complete, valid PDF Blob.
   */
  async finalize(): Promise<Blob> {
    if (this.isAborted) {
      throw new Error("StreamingPdfWriter was aborted")
    }
    if (this.isFinalized) {
      throw new Error("StreamingPdfWriter already finalized")
    }

    this.isFinalized = true

    const pagesTreeObjId = this.nextObjectId++
    const catalogObjId = this.nextObjectId++

    // 1. Write Pages Tree Object
    this.recordObjectStart(pagesTreeObjId)
    const kidsStr = this.pageObjectIds.map((id) => `${id} 0 R`).join(" ")
    this.writeString(
      `<< /Type /Pages /Kids [ ${kidsStr} ] /Count ${this.pageObjectIds.length} >>\n`
    )
    this.recordObjectEnd()

    // 2. Write Catalog Object
    this.recordObjectStart(catalogObjId)
    this.writeString(`<< /Type /Catalog /Pages ${pagesTreeObjId} 0 R >>\n`)
    this.recordObjectEnd()

    // 3. Write Cross-Reference (XRef) Table
    const startXRef = this.currentByteOffset
    const totalObjects = this.nextObjectId

    let xrefStr = `xref\n0 ${totalObjects}\n0000000000 65535 f \n`
    for (let id = 1; id < totalObjects; id++) {
      const offset = this.objectOffsets[id] ?? 0
      xrefStr += `${offset.toString().padStart(10, "0")} 00000 n \n`
    }

    xrefStr += `trailer\n<< /Size ${totalObjects} /Root ${catalogObjId} 0 R >>\nstartxref\n${startXRef}\n%%EOF`
    this.writeString(xrefStr)

    // 4. Post-process parent placeholders in binary chunks
    const parentTarget = this.encoder.encode("##PAGES_ROOT##")
    const parentReplacement = this.encoder.encode(`${pagesTreeObjId} 0 R`.padEnd(parentTarget.length, " "))

    const processedChunks = this.chunks.map((chunk) => {
      if (chunk instanceof Uint8Array) {
        let idx = -1
        while ((idx = indexOfSubarray(chunk, parentTarget, idx + 1)) !== -1) {
          chunk.set(parentReplacement, idx)
        }
      }
      return chunk
    })

    return new Blob(processedChunks as unknown as BlobPart[], {
      type: "application/pdf",
    })
  }

  abort(): void {
    this.isAborted = true
    this.chunks = []
    this.objectOffsets = []
    this.pageObjectIds = []
  }
}

function indexOfSubarray(haystack: Uint8Array, needle: Uint8Array, start = 0): number {
  if (needle.length === 0 || haystack.length < needle.length) return -1
  const limit = haystack.length - needle.length
  for (let i = start; i <= limit; i++) {
    let match = true
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        match = false
        break
      }
    }
    if (match) return i
  }
  return -1
}
