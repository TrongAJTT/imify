export type PackagerJobMode = "zip" | "merge_pdf" | "pdf_zip"

export interface PackagerStartMessage {
  id: number
  type: "start"
  mode: PackagerJobMode
  totalFiles: number
  exportFileName: string
  zipLevel?: number
}

export interface PackagerAddMessage {
  id: number
  type: "add"
  name: string
  mimeType: string
  buffer: ArrayBuffer
}

export interface PackagerFinalizeMessage {
  id: number
  type: "finalize"
}

export interface PackagerCancelMessage {
  id: number
  type: "cancel"
}

export type PackagerWorkerRequestMessage = PackagerStartMessage | PackagerAddMessage | PackagerFinalizeMessage | PackagerCancelMessage

export interface PackagerProgressMessage {
  id: number
  type: "progress"
  percent: number
  message: string
}

export interface PackagerResultSuccessMessage {
  id: number
  type: "result"
  ok: true
  outputBuffer: ArrayBuffer
  mimeType: string
  outputFileName: string
}

export interface PackagerResultErrorMessage {
  id: number
  type: "result"
  ok: false
  error: string
}

export type PackagerWorkerResponseMessage = PackagerProgressMessage | PackagerResultSuccessMessage | PackagerResultErrorMessage

export interface PackagerInputEntry {
  name: string
  blob: Blob
}

export interface PackagerRunParams {
  mode: PackagerJobMode
  entries: PackagerInputEntry[]
  exportFileName: string
  zipLevel?: number
  onProgress?: (payload: { percent: number; message: string }) => void
}

export interface PackagerRunResult {
  outputBlob: Blob
  outputFileName: string
}
