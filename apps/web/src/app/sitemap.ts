import type { MetadataRoute } from "next"
import { APP_ROUTES } from "@imify/core"

export const dynamic = "force-static"

const PUBLIC_ROUTES = [
  APP_ROUTES.HOME,
  APP_ROUTES.EXTENSION,
  APP_ROUTES.SINGLE_PROCESSOR,
  APP_ROUTES.BATCH_PROCESSOR,
  APP_ROUTES.SPLITTER,
  APP_ROUTES.SPLICING,
  APP_ROUTES.PATTERN_GENERATOR,
  APP_ROUTES.FILLING,
  APP_ROUTES.DIFFCHECKER,
  APP_ROUTES.INSPECTOR,
  APP_ROUTES.PDF_STUDIO,
  APP_ROUTES.COLLAGE_MAKER,
  APP_ROUTES.BACKGROUND_REMOVER,
  APP_ROUTES.UPSCALER,
  APP_ROUTES.QR_GENERATOR,
  APP_ROUTES.QR_READER,
  APP_ROUTES.RECOVERY,
] as const


function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://imify.app"
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()

  return PUBLIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.8
  }))
}
