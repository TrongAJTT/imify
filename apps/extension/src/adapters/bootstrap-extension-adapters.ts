import { registerStorageAdapter } from "@imify/core/storage-adapter"
import {
  FEATURE_MEDIA_ASSET_PATHS,
  registerFeatureMediaRuntimeAdapter
} from "@imify/features/shared/media-assets"
import { registerCustomFormatStorageAccess } from "@imify/engine/custom-formats"
import { registerEngineRuntimeAdapter } from "@imify/engine/converter/runtime-adapter"
import { setPreviewWorkerFactory } from "@imify/engine/converter/preview-worker-client"
import { patchStorageState } from "@/adapters/chrome-storage-state"
import { plasmoStorageAdapter } from "@/adapters/plasmo-storage-adapter"
import avifFactoryModule from "../../assets/wasm/avif_enc.js"
import jxlFactoryModule from "../../assets/wasm/jxl_enc.js"
import mozjpegFactoryModule from "../../assets/wasm/mozjpeg_enc.js"
import webpFactoryModule from "../../assets/wasm/webp_enc.js"
import * as oxipngModule from "../../assets/wasm/oxipng.js"
import * as resizeModule from "../../assets/wasm/squoosh_resize.js"
import * as hqxModule from "../../assets/wasm/squooshhqx.js"
import * as magicKernelModule from "../../assets/wasm/jsquash_magic_kernel.js"
import iconPng from "url:@assets/icon.png"
import githubLogoSvg from "url:@assets/images/github-logo.svg"
import bmcLogoSvg from "url:@assets/images/bmc-logo.svg"
import devExportStep1Webp from "url:@assets/images/dev-export-1.webp"
import devExportStep2Webp from "url:@assets/images/dev-export-2.webp"
import downloadHintChromeWebp from "url:@assets/images/img-download-not-ask-chrome.webp"
import downloadHintEdgeWebp from "url:@assets/images/img-download-not-ask-edge.webp"
import downloadHintFirefoxWebp from "url:@assets/images/img-download-not-ask-firefox.webp"
import devModeEnableVideoWebm from "url:@assets/features/dev_mode-enable.webm"
import previewSingleProcessorWebp from "url:@assets/features/preview-single_processor.webp"
import previewBatchProcessorWebp from "url:@assets/features/preview-batch_processor.webp"
import previewSplitter1Webp from "url:@assets/features/preview-image_splitter-1.webp"
import previewSplitter2Webp from "url:@assets/features/preview-image_splitter-2.webp"
import previewSplitter3Webp from "url:@assets/features/preview-image_splitter-3.webp"
import splitterGuideVisualControlWebm from "url:@assets/features/guide-image_splitter-visual_guides_control.webm"
import previewImageSplicingWebp from "url:@assets/features/preview-image_splicing.webp"
import previewImageFillingWebp from "url:@assets/features/preview-image_filling.webp"
import symmetricVisualEditorWebm from "url:@assets/features/guide-symgen-visual_editor.webm"
import manualMultiSelectWebm from "url:@assets/features/guide-image_filling_manual-visual_multi_select.webm"
import previewPatternGeneratorWebp from "url:@assets/features/preview-pattern_generator.webp"

let adaptersBootstrapped = false
const extensionMediaAssetMap: Record<string, string> = {
  [FEATURE_MEDIA_ASSET_PATHS.brand.imifyLogoPng]: iconPng,
  [FEATURE_MEDIA_ASSET_PATHS.brand.githubLogoSvg]: githubLogoSvg,
  [FEATURE_MEDIA_ASSET_PATHS.brand.buyMeCoffeeLogoSvg]: bmcLogoSvg,
  [FEATURE_MEDIA_ASSET_PATHS.devMode.exportStep1Webp]: devExportStep1Webp,
  [FEATURE_MEDIA_ASSET_PATHS.devMode.exportStep2Webp]: devExportStep2Webp,
  [FEATURE_MEDIA_ASSET_PATHS.devMode.enableVideoWebm]: devModeEnableVideoWebm,
  [FEATURE_MEDIA_ASSET_PATHS.processor.previewSingleWebp]: previewSingleProcessorWebp,
  [FEATURE_MEDIA_ASSET_PATHS.processor.previewBatchWebp]: previewBatchProcessorWebp,
  [FEATURE_MEDIA_ASSET_PATHS.splitter.preview1Webp]: previewSplitter1Webp,
  [FEATURE_MEDIA_ASSET_PATHS.splitter.preview2Webp]: previewSplitter2Webp,
  [FEATURE_MEDIA_ASSET_PATHS.splitter.guideVisualControlWebm]: splitterGuideVisualControlWebm,
  [FEATURE_MEDIA_ASSET_PATHS.splicing.previewWebp]: previewImageSplicingWebp,
  [FEATURE_MEDIA_ASSET_PATHS.pattern.previewWebp]: previewPatternGeneratorWebp,
  [FEATURE_MEDIA_ASSET_PATHS.filling.previewImageWebp]: previewImageFillingWebp,
  [FEATURE_MEDIA_ASSET_PATHS.filling.symmetricVisualEditorWebm]: symmetricVisualEditorWebm,
  [FEATURE_MEDIA_ASSET_PATHS.filling.manualMultiSelectWebm]: manualMultiSelectWebm,
  [FEATURE_MEDIA_ASSET_PATHS.downloadHints.chromeWebp]: downloadHintChromeWebp,
  [FEATURE_MEDIA_ASSET_PATHS.downloadHints.edgeWebp]: downloadHintEdgeWebp,
  [FEATURE_MEDIA_ASSET_PATHS.downloadHints.firefoxWebp]: downloadHintFirefoxWebp
}

const extensionWasmFactoryMap: Record<string, unknown> = {
  "avif_enc.js": avifFactoryModule,
  "jxl_enc.js": jxlFactoryModule,
  "mozjpeg_enc.js": mozjpegFactoryModule,
  "webp_enc.js": webpFactoryModule
}

const extensionWasmModuleMap: Record<string, unknown> = {
  "oxipng.js": oxipngModule,
  "squoosh_resize.js": resizeModule,
  "squooshhqx.js": hqxModule,
  "jsquash_magic_kernel.js": magicKernelModule
}

export function bootstrapExtensionAdapters(): void {
  if (adaptersBootstrapped) {
    return
  }

  registerStorageAdapter(plasmoStorageAdapter)
  registerFeatureMediaRuntimeAdapter({
    resolveAssetUrl: (url) => {
      if (!url.startsWith("/")) {
        return url
      }

      const mappedAssetUrl = extensionMediaAssetMap[url]
      if (mappedAssetUrl) {
        return mappedAssetUrl
      }

      return chrome.runtime.getURL(url.replace(/^\//, ""))
    }
  })
  registerCustomFormatStorageAccess({ patchStorageState })
  registerEngineRuntimeAdapter({
    resolveWasmUrl: (fileName) => chrome.runtime.getURL(`assets/wasm/${fileName}`),
    getWasmFactoryModule: (fileName) => extensionWasmFactoryMap[fileName] ?? null,
    getWasmNamedModule: (fileName) => extensionWasmModuleMap[fileName] ?? null,
    useWasmWorkers: false,
    createWasmWorker: () =>
      new Worker(new URL("@imify/engine/converter/wasm-encode.worker", import.meta.url), {
        type: "module"
      }),
    createConversionWorker: () =>
      new Worker(new URL("@imify/engine/converter/conversion.worker", import.meta.url), {
        type: "module"
      })
  })
  setPreviewWorkerFactory(
    () =>
      new Worker(new URL("@imify/engine/converter/preview.worker", import.meta.url), {
        type: "module"
      })
  )

  adaptersBootstrapped = true
}
