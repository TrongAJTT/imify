/**
 * Standard route paths for Imify Web & PWA
 */
export const APP_ROUTES = {
  HOME: "/",
  EXTENSION: "/extension",
  RECOVERY: "/recovery",
  UPDATE: "/update",
  REDIRECT: "/redirect",
  SINGLE_PROCESSOR: "/single-processor",
  SINGLE_PROCESSOR_WORK: "/single-processor/work",
  BATCH_PROCESSOR: "/batch-processor",
  BATCH_PROCESSOR_WORK: "/batch-processor/work",
  SPLITTER: "/splitter",
  SPLITTER_WORK: "/splitter/work",
  SPLICING: "/splicing",
  SPLICING_WORK: "/splicing/work",
  PATTERN_GENERATOR: "/pattern-generator",
  PATTERN_GENERATOR_WORK: "/pattern-generator/work",
  FILLING: "/filling",
  FILLING_FILL: "/filling/fill",
  FILLING_EDIT: "/filling/edit",
  FILLING_SYMMETRIC: "/filling/symmetric-generate",
  FILLING_GRID: "/filling/grid-design",
  COLLAGE_MAKER: "/collage-maker",
  DIFFCHECKER: "/diffchecker",
  INSPECTOR: "/inspector",
  PDF_STUDIO: "/pdf-studio",
  BACKGROUND_REMOVER: "/background-remover",
  UPSCALER: "/upscaler",
  QR_GENERATOR: "/qr-generator",
  QR_READER: "/qr-reader",
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
