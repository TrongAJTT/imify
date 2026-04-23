// PLATFORM:extension — uses chrome.* browser APIs. Do not import in web app.
import type { FormatConfig } from "@imify/core/types"
import type { ConvertImageResult } from "@imify/engine/converter"
import { OFFSCREEN_CONVERT_REQUEST, OFFSCREEN_DOCUMENT_PATH,
  type OffscreenConvertRequest, type OffscreenConvertResponse } from "@/background/offscreen-types"

let creatingOffscreenPromise: Promise<void> | null = null
let hasCreatedOffscreenDocument = false

async function hasOffscreenDocument(url: string): Promise<boolean> {
  const runtimeAny = chrome.runtime as unknown as {
    getContexts?: (options: {
      contextTypes?: string[]
      documentUrls?: string[]
    }) => Promise<Array<{ documentUrl?: string }>>
  }

  if (typeof runtimeAny.getContexts !== "function") {
    return false
  }

  const contexts = await runtimeAny.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [url]
  })

  return contexts.length > 0
}

async function ensureOffscreenDocument(): Promise<void> {
  const targetUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)

  if (hasCreatedOffscreenDocument) {
    return
  }

  if (await hasOffscreenDocument(targetUrl)) {
    hasCreatedOffscreenDocument = true
    return
  }

  if (!creatingOffscreenPromise) {
    creatingOffscreenPromise = (async () => {
      if (!chrome.offscreen?.createDocument) {
        throw new Error("chrome.offscreen API is unavailable")
      }

      await chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: ["BLOBS" as unknown as chrome.offscreen.Reason],
        justification: "Run context-menu image conversion in offscreen document"
      })

      hasCreatedOffscreenDocument = true
    })().finally(() => {
      creatingOffscreenPromise = null
    })
  }

  await creatingOffscreenPromise
}

function toMessageError(reason: unknown): Error {
  if (reason instanceof Error) {
    return reason
  }

  return new Error(typeof reason === "string" ? reason : "Offscreen conversion failed")
}

export async function convertImageViaOffscreen(
  sourceBlob: Blob,
  config: FormatConfig
): Promise<ConvertImageResult> {
  await ensureOffscreenDocument()

  const payload: OffscreenConvertRequest = {
    sourceBlob,
    config
  }

  const response = (await chrome.runtime.sendMessage({
    type: OFFSCREEN_CONVERT_REQUEST,
    payload
  })) as OffscreenConvertResponse | undefined

  if (!response?.ok || !response.result) {
    throw toMessageError(response?.error ?? "Offscreen conversion failed")
  }

  return response.result
}
