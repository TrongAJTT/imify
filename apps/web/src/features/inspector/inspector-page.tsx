"use client"

import { SharedInspectorPage } from "@imify/features/inspector/inspector-page"
import { InspectorDropZone, InspectorSidebarPanel } from "@imify/features/inspector"
import { useMemo } from "react"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"

export function InspectorPage() {
  const sidebar = useMemo(() => <InspectorSidebarPanel />, [])
  useWorkspaceSidebar(sidebar)

  return (
    <SharedInspectorPage
      containerClassName="p-4"
      renderWorkspace={(props) => (
        <div className="space-y-4">
          {!props.file && !props.isAnalyzing && !props.error ? <InspectorDropZone onLoadFile={(file) => { void props.onLoadFile(file) }} /> : null}
          {props.isAnalyzing ? <p className="text-sm text-sky-600">Analyzing image...</p> : null}
          {props.error ? <p className="text-sm text-red-600">{props.error}</p> : null}
          {props.result?.basic ? (
            <div className="rounded-md border border-slate-300 p-3 text-sm">
              <p><strong>File:</strong> {props.result.basic.fileName}</p>
              <p><strong>Format:</strong> {props.result.basic.format}</p>
              <p><strong>Mime:</strong> {props.result.basic.mimeType}</p>
              <p><strong>Size:</strong> {props.result.basic.fileSize}</p>
            </div>
          ) : null}
          {props.imageUrl ? (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Preview</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={props.imageUrl} alt={props.file?.name ?? "selected image"} className="max-h-[480px] rounded border border-slate-300" />
            </div>
          ) : null}
        </div>
      )}
    />
  )
}
