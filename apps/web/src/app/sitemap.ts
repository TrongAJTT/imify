import type { MetadataRoute } from "next"

export const dynamic = "force-static"

const PUBLIC_ROUTES = [
  "/",
  "/extension",
  "/single-processor",
  "/batch-processor",
  "/splitter",
  "/splicing",
  "/pattern-generator",
  "/filling",
  "/diffchecker",
  "/inspector"
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
