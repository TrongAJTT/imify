import { Metadata } from "next"
import { BodyText, Heading } from "@imify/ui/ui/typography"
import { ExtensionDownloadButtons } from "./extension-download-buttons"
import { WEB_ROUTE_METADATA } from "../seo-metadata"

export const metadata: Metadata = WEB_ROUTE_METADATA.extension

export default function ExtensionPage() {
  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="mx-auto max-w-4xl text-center space-y-8 px-4 py-8">
        <Heading className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Supercharge Your Browser with <span className="text-blue-600 dark:text-blue-400">Imify</span>
        </Heading>
        <BodyText className="mx-auto max-w-2xl text-lg md:text-xl text-slate-600 dark:text-slate-400">
          Unlock exclusive features deeply integrated into your browser workflow. Download Imify for your favorite browser to access Context Menu processing, active tab SEO audits, and more.
        </BodyText>
        
        <ExtensionDownloadButtons />
      </section>

      {/* Extension Exclusive Features */}
      <section className="border-y border-indigo-200/70 bg-indigo-100/70 py-24 dark:border-indigo-800/60 dark:bg-indigo-950/35">
        <div className="mx-auto w-full px-4 md:px-8 lg:px-12 xl:px-16 space-y-16">
          <div className="text-center space-y-4">
            <Heading className="text-3xl md:text-4xl">Extension Exclusive Features</Heading>
            <BodyText className="mx-auto max-w-2xl text-slate-500 text-lg">
              By installing the browser extension, you get access to powerful tools that seamlessly integrate with your browsing experience.
            </BodyText>
          </div>

          {/* Feature 1: Context Menu */}
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-2xl overflow-hidden border border-slate-200 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:shadow-none bg-slate-100 dark:bg-slate-900 ring-1 ring-slate-200/50 dark:ring-slate-800/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="https://cdn.trongajtt.com/apps/imify/context-menu.webp" 
                alt="Imify Context Menu Preview" 
                className="w-full h-auto object-cover object-top transition-transform hover:scale-105 duration-700 ease-out"
                loading="lazy"
              />
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <Heading className="text-2xl text-blue-600 dark:text-blue-400 md:text-3xl">Context Menu Processing</Heading>
              <BodyText className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                Right-click on any image across the web to instantly resize, convert, or batch process it without leaving your current tab. Configure your favorite quick-actions for a seamless and lightning-fast workflow.
              </BodyText>
              <ul className="space-y-4 pt-2">
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                  <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                  <span>Process images directly from the right-click menu</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                  <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                  <span>Create custom presets for your most used formats</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                  <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                  <span>Send images to Imify workspaces with one click</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 2: SEO Audit */}
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="space-y-6">
              <Heading className="text-2xl text-fuchsia-600 dark:text-fuchsia-400 md:text-3xl">In-Page Image SEO Audit</Heading>
              <BodyText className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                Run a comprehensive SEO audit on all images within your active tab. Detect missing alt texts, oversized images, and inefficient formats instantly. Review detailed snapshots right in your browser&apos;s sidepanel.
              </BodyText>
              <ul className="space-y-4 pt-2">
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                  <div className="h-2 w-2 rounded-full bg-fuchsia-600 dark:bg-fuchsia-400 shrink-0" />
                  <span>Scan active pages for common image SEO issues</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                  <div className="h-2 w-2 rounded-full bg-fuchsia-600 dark:bg-fuchsia-400 shrink-0" />
                  <span>Save audit snapshots for later review</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                  <div className="h-2 w-2 rounded-full bg-fuchsia-600 dark:bg-fuchsia-400 shrink-0" />
                  <span>Analyze image rendering sizes vs. intrinsic sizes</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:shadow-none bg-slate-100 dark:bg-slate-900 ring-1 ring-slate-200/50 dark:ring-slate-800/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="https://cdn.trongajtt.com/apps/imify/seo-audit-preview.webp" 
                alt="Imify SEO Audit Preview" 
                className="w-full h-auto object-cover object-top transition-transform hover:scale-105 duration-700 ease-out"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
