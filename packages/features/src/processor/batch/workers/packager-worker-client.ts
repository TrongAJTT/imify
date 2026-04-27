import { zipSync } from "fflate"
import { convertImageToPdf, mergeImagesToPdf } from "@imify/engine/converter/pdf-engine"
import type { PackagerRunParams, PackagerRunResult } from "./packager-worker-protocol"

type ZipLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

function parseZipLevel(level: number | undefined): ZipLevel {
  if (!Number.isFinite(level)) return 6
  return Math.min(9, Math.max(0, Math.round(level as number))) as ZipLevel
}

function toUniqueName(name: string, used: Set<string>): string {
  const normalized = name.trim() || "output"
  if (!used.has(normalized)) {
    used.add(normalized)
    return normalized
  }
  const dotIndex = normalized.lastIndexOf(".")
  const hasExtension = dotIndex > 0 && dotIndex < normalized.length - 1
  const base = hasExtension ? normalized.slice(0, dotIndex) : normalized
  const ext = hasExtension ? normalized.slice(dotIndex) : ""
  let n = 2
  while (true) {
    const candidate = `${base}_${n}${ext}`
    if (!used.has(candidate)) {
      used.add(candidate)
      return candidate
    }
    n += 1
  }
}

function sanitizeBaseName(name: string): string {
  const stripped = name.replace(/\.[^.]+$/, "").trim()
  return stripped || "output"
}

async function nextTick(): Promise<void> {
  await Promise.resolve()
}

export class PackagerWorkerClient {
  private terminated = false

  async run(params: PackagerRunParams): Promise<PackagerRunResult> {
    if (this.terminated) {
      throw new Error("Packager worker terminated")
    }

    const total = Math.max(1, params.entries.length)
    const zipLevel = parseZipLevel(params.zipLevel)
    const report = (percent: number, message: string) => {
      params.onProgress?.({ percent, message })
    }

    if (params.mode === "merge_pdf") {
      report(8, "Collecting pages for merged PDF...")
      const blobs: Blob[] = []
      for (let i = 0; i < params.entries.length; i += 1) {
        if (this.terminated) throw new Error("Packager worker terminated")
        blobs.push(params.entries[i].blob)
        report(Math.min(52, 10 + Math.round(((i + 1) / total) * 42)), `Prepared ${i + 1}/${total} pages...`)
        await nextTick()
      }
      report(64, "Building merged PDF file...")
      const outputBlob = await mergeImagesToPdf(blobs)
      return { outputBlob, outputFileName: params.exportFileName }
    }

    const usedNames = new Set<string>()
    const archive: Record<string, Uint8Array> = {}

    if (params.mode === "pdf_zip") {
      report(6, "Preparing individual PDFs...")
      for (let i = 0; i < params.entries.length; i += 1) {
        if (this.terminated) throw new Error("Packager worker terminated")
        const entry = params.entries[i]
        const pdfBlob = await convertImageToPdf({ sourceBlob: entry.blob, resize: { mode: "none" } })
        const name = toUniqueName(`${sanitizeBaseName(entry.name)}.pdf`, usedNames)
        archive[name] = new Uint8Array(await pdfBlob.arrayBuffer())
        report(Math.min(76, 10 + Math.round(((i + 1) / total) * 66)), `Created ${i + 1}/${total} PDF files...`)
        await nextTick()
      }
      report(88, "Compressing PDF ZIP archive...")
      const bytes = zipSync(archive, { level: zipLevel })
      return { outputBlob: new Blob([bytes], { type: "application/zip" }), outputFileName: params.exportFileName }
    }

    report(6, "Collecting converted files...")
    for (let i = 0; i < params.entries.length; i += 1) {
      if (this.terminated) throw new Error("Packager worker terminated")
      const entry = params.entries[i]
      const name = toUniqueName(entry.name, usedNames)
      archive[name] = new Uint8Array(await entry.blob.arrayBuffer())
      report(Math.min(70, 10 + Math.round(((i + 1) / total) * 60)), `Added ${i + 1}/${total} files to ZIP...`)
      await nextTick()
    }
    report(82, "Compressing ZIP archive...")
    const bytes = zipSync(archive, { level: zipLevel })
    return { outputBlob: new Blob([bytes], { type: "application/zip" }), outputFileName: params.exportFileName }
  }

  terminate(): void {
    this.terminated = true
  }
}
