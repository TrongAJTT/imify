function isJpegBytes(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8
}

function toUint8Array(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer)
}

function extractExifApp1Segment(jpegBytes: Uint8Array): Uint8Array | null {
  if (!isJpegBytes(jpegBytes)) {
    return null
  }

  let offset = 2

  while (offset + 4 <= jpegBytes.length) {
    if (jpegBytes[offset] !== 0xff) {
      break
    }

    const marker = jpegBytes[offset + 1]
    if (marker === 0xda || marker === 0xd9) {
      break
    }

    const segmentLength = (jpegBytes[offset + 2] << 8) | jpegBytes[offset + 3]
    if (segmentLength < 2 || offset + 2 + segmentLength > jpegBytes.length) {
      break
    }

    if (marker === 0xe1) {
      const payloadStart = offset + 4
      const payloadEnd = offset + 2 + segmentLength
      const payload = jpegBytes.slice(payloadStart, payloadEnd)

      if (
        payload.length >= 6 &&
        payload[0] === 0x45 &&
        payload[1] === 0x78 &&
        payload[2] === 0x69 &&
        payload[3] === 0x66 &&
        payload[4] === 0x00 &&
        payload[5] === 0x00
      ) {
        return jpegBytes.slice(offset, payloadEnd)
      }
    }

    offset += 2 + segmentLength
  }

  return null
}

function findJpegInsertOffset(jpegBytes: Uint8Array): number {
  if (!isJpegBytes(jpegBytes)) {
    return 2
  }

  let offset = 2

  while (offset + 4 <= jpegBytes.length) {
    if (jpegBytes[offset] !== 0xff) {
      break
    }

    const marker = jpegBytes[offset + 1]
    if (marker !== 0xe0 && marker !== 0xe1) {
      break
    }

    const segmentLength = (jpegBytes[offset + 2] << 8) | jpegBytes[offset + 3]
    if (segmentLength < 2 || offset + 2 + segmentLength > jpegBytes.length) {
      break
    }

    offset += 2 + segmentLength
  }

  return offset
}

function injectExifSegment(targetJpegBytes: Uint8Array, exifSegment: Uint8Array): Uint8Array {
  const insertOffset = findJpegInsertOffset(targetJpegBytes)
  const merged = new Uint8Array(targetJpegBytes.length + exifSegment.length)

  merged.set(targetJpegBytes.slice(0, insertOffset), 0)
  merged.set(exifSegment, insertOffset)
  merged.set(targetJpegBytes.slice(insertOffset), insertOffset + exifSegment.length)

  return merged
}

export async function applyExifPolicy(params: {
  sourceBlob: Blob
  outputBlob: Blob
  stripExif: boolean
}): Promise<Blob> {
  const { sourceBlob, outputBlob, stripExif } = params

  if (stripExif) {
    return outputBlob
  }

  if (outputBlob.type !== "image/jpeg") {
    return outputBlob
  }

  if (sourceBlob.type !== "image/jpeg") {
    return outputBlob
  }

  const [sourceBuffer, outputBuffer] = await Promise.all([sourceBlob.arrayBuffer(), outputBlob.arrayBuffer()])
  const sourceBytes = toUint8Array(sourceBuffer)
  const outputBytes = toUint8Array(outputBuffer)
  const exifSegment = extractExifApp1Segment(sourceBytes)

  if (!exifSegment || !isJpegBytes(outputBytes)) {
    return outputBlob
  }

  const mergedBytes = injectExifSegment(outputBytes, exifSegment)
  return new Blob([mergedBytes as unknown as BlobPart], { type: "image/jpeg" })
}
