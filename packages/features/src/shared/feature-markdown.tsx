"use client"

import React, { useMemo } from "react"
import Markdown from "markdown-to-jsx"
import { BodyText, Heading, LabelText, Subheading } from "@imify/ui/ui/typography"
import { cn } from "@imify/ui/ui/utils"

function resolveMarkdownAssetUrl(src: string, markdownUrl: string): string {
  if (!src) return src
  if (/^(data:|blob:|https?:\/\/|chrome-extension:\/\/)/i.test(src)) {
    return src
  }

  try {
    const normalizedMarkdownUrl = markdownUrl.startsWith("http")
      ? markdownUrl
      : new URL(markdownUrl, window.location.origin).toString()
    return new URL(src, normalizedMarkdownUrl).toString()
  } catch {
    return src
  }
}

function MarkdownImage({
  src,
  alt,
  markdownUrl
}: {
  src?: string
  alt?: string
  markdownUrl: string
}) {
  const resolvedSrc = resolveMarkdownAssetUrl(src ?? "", markdownUrl)
  return (
    <img
      src={resolvedSrc}
      alt={alt ?? ""}
      className="my-4 w-auto max-w-full rounded-xl border border-slate-200 dark:border-slate-700"
      loading="lazy"
    />
  )
}

interface FeatureMarkdownProps {
  markdown: string
  markdownUrl: string
  className?: string
}

export function FeatureMarkdown({ markdown, markdownUrl, className }: FeatureMarkdownProps) {
  const options = useMemo(
    () => ({
      forceBlock: true,
      overrides: {
        h1: {
          component: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <Heading {...props} className={cn("text-3xl mt-8 mb-4 tracking-tight", props.className)} />
          )
        },
        h2: {
          component: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <Heading {...props} className={cn("text-2xl mt-7 mb-3 tracking-tight", props.className)} />
          )
        },
        h3: {
          component: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <Subheading {...props} className={cn("text-xl mt-6 mb-3 tracking-tight", props.className)} />
          )
        },
        h4: {
          component: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <LabelText as="h4" {...props} className={cn("text-base mt-5 mb-2", props.className)} />
          )
        },
        p: {
          component: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
            <BodyText {...props} className={cn("leading-7 mb-3", props.className)} />
          )
        },
        ul: { props: { className: "list-disc pl-6 space-y-1.5 mb-3 text-sm text-slate-700 dark:text-slate-300" } },
        ol: { props: { className: "list-decimal pl-6 space-y-1.5 mb-3 text-sm text-slate-700 dark:text-slate-300" } },
        li: { props: { className: "leading-7" } },
        strong: { props: { className: "font-semibold text-slate-900 dark:text-slate-100" } },
        code: {
          props: {
            className:
              "font-mono text-[0.85em] px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
          }
        },
        pre: {
          props: {
            className:
              "mb-4 rounded-xl p-3 overflow-x-auto bg-slate-900 text-slate-100 text-xs leading-6"
          }
        },
        hr: { props: { className: "my-6 border-slate-200 dark:border-slate-700" } },
        blockquote: {
          props: {
            className:
              "my-4 border-l-4 border-violet-300 dark:border-violet-700 pl-3 text-slate-600 dark:text-slate-300 italic"
          }
        },
        img: {
          component: (props: { src?: string; alt?: string }) => (
            <MarkdownImage src={props.src} alt={props.alt} markdownUrl={markdownUrl} />
          )
        }
      }
    }),
    [markdownUrl]
  )

  return (
    <article className={cn("max-w-none", className)}>
      <Markdown options={options}>{markdown}</Markdown>
    </article>
  )
}

