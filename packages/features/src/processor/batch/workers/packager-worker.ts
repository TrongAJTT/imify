import "./packager.worker"

export {}
import { zipSync } from "fflate"
import { convertImageToPdf, mergeImagesToPdf } from "@imify/engine/converter/pdf-engine"
import type {
  PackagerAddMessage,
  PackagerCancelMessage,
  PackagerFinalizeMessage,
  PackagerStartMessage,
  PackagerWorkerRequestMessage,
  PackagerWorkerResponseMessage
} from "./packager-worker-protocol"

interface BasePackagerJob {
  mode: "zip" | "merge_pdf" | "pdf_zip"
  totalFiles: number
  receivedFiles: number
  exportFileName: string
  queue: Promise<void>
  failed: boolean
}
interface ZipEntry { name: string; data: Uint8Array }
type ZipLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
interface ZipPackagerJob extends BasePackagerJob { mode: "zip"; entries: ZipEntry[]; entryNames: Set<string>; zipLevel: ZipLevel }
interface MergePdfPackagerJob extends BasePackagerJob { mode: "merge_pdf"; blobs: Blob[] }
interface PdfZipPackagerJob extends BasePackagerJob { mode: "pdf_zip"; entries: ZipEntry[]; entryNames: Set<string>; zipLevel: ZipLevel }
type PackagerJob = ZipPackagerJob | MergePdfPackagerJob | PdfZipPackagerJob

const workerPostMessage = globalThis as unknown as {
  postMessage: (message: PackagerWorkerResponseMessage, transfer?: Transferable[]) => void
}
const jobs = new Map<number, PackagerJob>()

function postProgress(id: number, percent: number, message: string): void {
  workerPostMessage.postMessage({ id, type: "progress", percent, message })
}
function failJob(id: number, error: unknown): void {
  const job = jobs.get(id)
  if (job) {
    job.failed = true
    jobs.delete(id)
  }
  workerPostMessage.postMessage({
    id,
    type: "result",
    ok: false,
    error: error instanceof Error ? error.message : "Unknown packager worker error"
  })
}
function parseZipLevel(level: number | undefined): ZipLevel {
  if (!Number.isFinite(level)) return 6
  return Math.min(9, Math.max(0, Math.round(level as number))) as ZipLevel
}
function sanitizeBaseName(fileName: string): string {
  const stripped = fileName.replace(/\.[^.]+$/, "").trim()
  return stripped.length ? stripped : "output"
}
function toTransferableArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer
}
function ensureUniqueEntryName(name: string, usedNames: Set<string>): string {
  const normalized = name.trim().length ? name.trim() : "output"
  if (!usedNames.has(normalized)) {
    usedNames.add(normalized)
    return normalized
  }
  const dotIndex = normalized.lastIndexOf(".")
  const hasExtension = dotIndex > 0 && dotIndex < normalized.length - 1
  const base = hasExtension ? normalized.slice(0, dotIndex) : normalized
  const extension = hasExtension ? normalized.slice(dotIndex) : ""
  let suffix = 2
  while (true) {
    const candidate = `${base}_${suffix}${extension}`
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate)
      return candidate
    }
    suffix += 1
  }
}
function buildZipBytes(entries: ZipEntry[], level: ZipLevel): Uint8Array {
  const archive: Record<string, Uint8Array> = {}
  for (const entry of entries) archive[entry.name] = entry.data
  return zipSync(archive, { level })
}
function ensureJob(id: number): PackagerJob {
  const job = jobs.get(id)
  if (!job || job.failed) throw new Error("Packager job is missing or has already failed")
  return job
}
function enqueueJobStep(id: number, step: (job: PackagerJob) => Promise<void>): void {
  const job = ensureJob(id)
  job.queue = job.queue
    .then(async () => {
      const current = ensureJob(id)
      await step(current)
    })
    .catch((error) => {
      failJob(id, error)
    })
}
function onStart(message: PackagerStartMessage): void {
  if (jobs.get(message.id)) {
    failJob(message.id, new Error("Packager job id already exists"))
    return
  }
  const totalFiles = Math.max(0, Math.floor(message.totalFiles || 0))
  if (message.mode === "zip") {
    jobs.set(message.id, {
      mode: "zip",
      totalFiles,
      receivedFiles: 0,
      exportFileName: message.exportFileName,
      queue: Promise.resolve(),
      failed: false,
      entries: [],
      entryNames: new Set<string>(),
      zipLevel: parseZipLevel(message.zipLevel)
    })
    postProgress(message.id, 6, "Collecting converted files...")
    return
  }
  if (message.mode === "merge_pdf") {
    jobs.set(message.id, {
      mode: "merge_pdf",
      totalFiles,
      receivedFiles: 0,
      exportFileName: message.exportFileName,
      queue: Promise.resolve(),
      failed: false,
      blobs: []
    })
    postProgress(message.id, 8, "Collecting pages for merged PDF...")
    return
  }
  jobs.set(message.id, {
    mode: "pdf_zip",
    totalFiles,
    receivedFiles: 0,
    exportFileName: message.exportFileName,
    queue: Promise.resolve(),
    failed: false,
    entries: [],
    entryNames: new Set<string>(),
    zipLevel: parseZipLevel(message.zipLevel)
  })
  postProgress(message.id, 6, "Preparing individual PDFs...")
}
async function onAdd(message: PackagerAddMessage): Promise<void> {
  const job = ensureJob(message.id)
  const sourceBytes = new Uint8Array(message.buffer)
  const blob = new Blob([message.buffer], { type: message.mimeType || "application/octet-stream" })
  if (job.mode === "zip") {
    job.entries.push({ name: ensureUniqueEntryName(message.name, job.entryNames), data: sourceBytes })
    job.receivedFiles += 1
    postProgress(
      message.id,
      job.totalFiles > 0 ? Math.min(70, 10 + Math.round((job.receivedFiles / job.totalFiles) * 60)) : 70,
      `Added ${job.receivedFiles}/${job.totalFiles} files to ZIP...`
    )
    return
  }
  if (job.mode === "merge_pdf") {
    job.blobs.push(blob)
    job.receivedFiles += 1
    postProgress(
      message.id,
      job.totalFiles > 0 ? Math.min(52, 10 + Math.round((job.receivedFiles / job.totalFiles) * 42)) : 52,
      `Prepared ${job.receivedFiles}/${job.totalFiles} pages...`
    )
    return
  }
  const pdfBlob = await convertImageToPdf({ sourceBlob: blob, resize: { mode: "none" } })
  job.receivedFiles += 1
  job.entries.push({
    name: ensureUniqueEntryName(`${sanitizeBaseName(message.name)}.pdf`, job.entryNames),
    data: new Uint8Array(await pdfBlob.arrayBuffer())
  })
  postProgress(
    message.id,
    job.totalFiles > 0 ? Math.min(76, 10 + Math.round((job.receivedFiles / job.totalFiles) * 66)) : 76,
    `Created ${job.receivedFiles}/${job.totalFiles} PDF files...`
  )
}
async function onFinalize(message: PackagerFinalizeMessage): Promise<void> {
  const job = ensureJob(message.id)
  if (job.mode === "zip") {
    postProgress(message.id, 82, "Compressing ZIP archive...")
    const outputBuffer = toTransferableArrayBuffer(buildZipBytes(job.entries, job.zipLevel))
    jobs.delete(message.id)
    workerPostMessage.postMessage(
      {
        id: message.id,
        type: "result",
        ok: true,
        outputBuffer,
        mimeType: "application/zip",
        outputFileName: job.exportFileName
      },
      [outputBuffer]
    )
    return
  }
  if (job.mode === "merge_pdf") {
    postProgress(message.id, 64, "Building merged PDF file...")
    const outputBuffer = await (await mergeImagesToPdf(job.blobs)).arrayBuffer()
    jobs.delete(message.id)
    workerPostMessage.postMessage(
      {
        id: message.id,
        type: "result",
        ok: true,
        outputBuffer,
        mimeType: "application/pdf",
        outputFileName: job.exportFileName
      },
      [outputBuffer]
    )
    return
  }
  postProgress(message.id, 88, "Compressing PDF ZIP archive...")
  const outputBuffer = toTransferableArrayBuffer(buildZipBytes(job.entries, job.zipLevel))
  jobs.delete(message.id)
  workerPostMessage.postMessage(
    {
      id: message.id,
      type: "result",
      ok: true,
      outputBuffer,
      mimeType: "application/zip",
      outputFileName: job.exportFileName
    },
    [outputBuffer]
  )
}
function onCancel(message: PackagerCancelMessage): void {
  const job = jobs.get(message.id)
  if (!job) return
  job.failed = true
  jobs.delete(message.id)
}

self.onmessage = (event: MessageEvent<PackagerWorkerRequestMessage>) => {
  const message = event.data
  if (!message) return
  try {
    if (message.type === "start") {
      onStart(message)
      return
    }
    if (message.type === "cancel") {
      onCancel(message)
      return
    }
    if (message.type === "add") {
      enqueueJobStep(message.id, (job) => (job.failed ? Promise.resolve() : onAdd(message)))
      return
    }
    enqueueJobStep(message.id, (job) => (job.failed ? Promise.resolve() : onFinalize(message)))
  } catch (error) {
    failJob(message.id, error)
  }
}

export {}
