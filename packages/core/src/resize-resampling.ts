import type { ResizeResamplingAlgorithm } from "./types"

export const DEFAULT_RESAMPLING_ALGORITHM: ResizeResamplingAlgorithm = "browser-default"

export const RESAMPLING_ALGORITHM_OPTIONS: Array<{
  value: ResizeResamplingAlgorithm
  label: string
}> = [
  { value: "browser-default", label: "Browser Default (Fastest)" },
  { value: "lanczos3", label: "Lanczos3 (Best for Photos)" },
  { value: "magic-kernel", label: "Magic Kernel (Best for Text/Logos)" },
  { value: "hqx", label: "Pixel Art / HQX (Crisp Upscaling)" }
]

export function normalizeResizeResamplingAlgorithm(
  value: unknown
): ResizeResamplingAlgorithm {
  if (
    value === "browser-default" ||
    value === "lanczos3" ||
    value === "magic-kernel" ||
    value === "hqx"
  ) {
    return value
  }

  return DEFAULT_RESAMPLING_ALGORITHM
}

export function isAdvancedResamplingAlgorithm(
  algorithm: ResizeResamplingAlgorithm | undefined
): algorithm is Exclude<ResizeResamplingAlgorithm, "browser-default"> {
  return algorithm === "lanczos3" || algorithm === "magic-kernel" || algorithm === "hqx"
}
