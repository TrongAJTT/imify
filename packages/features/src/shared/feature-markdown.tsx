"use client"

import React, { useMemo } from "react"
import Markdown from "markdown-to-jsx"
import { BodyText, Heading, LabelText, Subheading } from "@imify/ui/ui/typography"
import { cn } from "@imify/ui/ui/utils"
import { resolveFeatureMediaAssetUrl } from "./media-assets"

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

function getRawText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getRawText).join("");
  }
  if (React.isValidElement(node) && node.props && node.props.children) {
    return getRawText(node.props.children);
  }
  return "";
}

function cleanAlertPrefix(node: React.ReactNode): React.ReactNode {
  if (typeof node === "string") {
    return node.replace(/^\[!(NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]\s*/i, "");
  }
  if (Array.isArray(node)) {
    const firstCleaned = cleanAlertPrefix(node[0]);
    return [firstCleaned, ...node.slice(1)];
  }
  if (React.isValidElement(node) && node.props && node.props.children) {
    return React.cloneElement(node as React.ReactElement, {}, cleanAlertPrefix(node.props.children));
  }
  return node;
}

function MarkdownBlockquote({ children }: React.HTMLAttributes<HTMLQuoteElement>) {
  const rawText = getRawText(children).trim();
  let alertType: "note" | "important" | "warning" | "tip" | "caution" | null = null;

  if (rawText.startsWith("[!NOTE]")) {
    alertType = "note";
  } else if (rawText.startsWith("[!IMPORTANT]")) {
    alertType = "important";
  } else if (rawText.startsWith("[!WARNING]")) {
    alertType = "warning";
  } else if (rawText.startsWith("[!TIP]")) {
    alertType = "tip";
  } else if (rawText.startsWith("[!CAUTION]")) {
    alertType = "caution";
  }

  if (alertType) {
    const cleanChildren = cleanAlertPrefix(children);
    let borderClass = "";
    let titleText = "";
    let titleColorClass = "";
    let bgClass = "";

    switch (alertType) {
      case "note":
        borderClass = "border-blue-500 dark:border-blue-400";
        titleText = "Note";
        titleColorClass = "text-blue-600 dark:text-blue-400";
        bgClass = "bg-blue-50/40 dark:bg-blue-950/10";
        break;
      case "important":
        borderClass = "border-purple-500 dark:border-purple-400";
        titleText = "Important";
        titleColorClass = "text-purple-600 dark:text-purple-400";
        bgClass = "bg-purple-50/40 dark:bg-purple-950/10";
        break;
      case "warning":
        borderClass = "border-amber-500 dark:border-amber-400";
        titleText = "Warning";
        titleColorClass = "text-amber-600 dark:text-amber-400";
        bgClass = "bg-amber-50/40 dark:bg-amber-950/10";
        break;
      case "tip":
        borderClass = "border-emerald-500 dark:border-emerald-400";
        titleText = "Tip";
        titleColorClass = "text-emerald-600 dark:text-emerald-400";
        bgClass = "bg-emerald-50/40 dark:bg-emerald-950/10";
        break;
      case "caution":
        borderClass = "border-red-500 dark:border-red-400";
        titleText = "Caution";
        titleColorClass = "text-red-600 dark:text-red-400";
        bgClass = "bg-red-50/40 dark:bg-red-950/10";
        break;
    }

    return (
      <div className={cn("my-4 border-l-4 pl-4 pr-3 py-3 rounded-r-xl text-sm leading-relaxed", borderClass, bgClass)}>
        <div className={cn("font-bold text-xs uppercase tracking-wider mb-1", titleColorClass)}>
          {titleText}
        </div>
        <div className="text-slate-700 dark:text-slate-300 font-normal">
          {cleanChildren}
        </div>
      </div>
    );
  }

  return (
    <blockquote className="my-4 border-l-4 border-violet-300 dark:border-violet-700 pl-3 text-slate-600 dark:text-slate-300 italic">
      {children}
    </blockquote>
  );
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
          component: MarkdownBlockquote
        },
        a: {
          component: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold underline underline-offset-4 decoration-sky-500/30 hover:decoration-sky-500 transition-colors",
                props.className
              )}
            />
          )
        },
        img: {
          component: (props: { src?: string; alt?: string }) => (
            <MarkdownImage src={props.src} alt={props.alt} markdownUrl={markdownUrl} />
          )
        },
        video: {
          component: (props: any) => {
            const resolvedSrc = resolveFeatureMediaAssetUrl(props.src ?? "")
            return <video {...props} src={resolvedSrc} />
          }
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

