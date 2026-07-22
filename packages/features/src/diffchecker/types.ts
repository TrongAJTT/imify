export type DiffViewMode = "split" | "side_by_side" | "overlay" | "difference"

export type DiffAlgorithm = "heatmap" | "binary" | "ssim"

export type DiffAlignMode = "original" | "fit-larger" | "fit-smaller"

export type DiffAlignAnchor = "top-left" | "center"

export type MultiImageLayout2 = "2_cols" | "2_rows"

export type MultiImageLayout3 = "3_cols" | "3_rows"

export type MultiImageLayout4 = "2x2_grid" | "4_cols" | "4_rows"

export type MultiImageLayout = MultiImageLayout2 | MultiImageLayout3 | MultiImageLayout4

export interface DiffImageItem {
  id: string
  file: File
  url: string
  width: number
  height: number
  name: string
}

export interface DiffStats {
  totalPixels: number
  changedPixels: number
  changePercent: number
  meanDifference: number
  maxDifference: number
  ssimScore: number
}

export interface AlignedPair {
  dataA: ImageData
  dataB: ImageData
  width: number
  height: number
}

export interface DiffComputeResult {
  alignedDataA: ImageData
  alignedDataB: ImageData
  diffImageData: ImageData
  alignedUrlA: string
  alignedUrlB: string
  diffImageUrl: string
  stats: DiffStats
  width: number
  height: number
}
