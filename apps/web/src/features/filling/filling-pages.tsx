"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@imify/ui/ui/button"
import { useFillingStore } from "@imify/stores/stores/filling-store"
import type { FillingStep } from "@imify/features/filling/types"

type FillingMode = "select" | "fill" | "edit" | "symmetric-generate"

interface FillingHomePageProps {
  routeBase: string
}

interface FillingFlowPageProps {
  mode: FillingMode
  templateId: string
  routeBase: string
}

function toTitle(mode: FillingMode): string {
  if (mode === "fill") return "Filling Workspace"
  if (mode === "edit") return "Filling Editor"
  if (mode === "symmetric-generate") return "Symmetric Generate"
  return "Filling"
}

function toFillingStep(mode: FillingMode): FillingStep {
  if (mode === "fill") return "select"
  if (mode === "edit") return "create_manual"
  return "create_symmetric"
}

export function FillingHomePage({ routeBase }: FillingHomePageProps) {
  const templates = useFillingStore((state) => state.templates)
  const templatesLoaded = useFillingStore((state) => state.templatesLoaded)

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-lg font-semibold">Filling templates</h1>
      <p className="text-sm text-slate-500">
        Current templates in store: {templates.length} ({templatesLoaded ? "loaded" : "not loaded"})
      </p>
      {templates.length ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="truncate text-sm font-medium">{template.name}</p>
              <p className="mt-1 text-xs text-slate-500">id: {template.id}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link className="text-xs text-sky-600 dark:text-sky-400" href={`${routeBase}/fill?id=${template.id}`}>
                  Fill
                </Link>
                <Link className="text-xs text-sky-600 dark:text-sky-400" href={`${routeBase}/edit?id=${template.id}`}>
                  Edit
                </Link>
                <Link className="text-xs text-sky-600 dark:text-sky-400" href={`${routeBase}/symmetric-generate?id=${template.id}`}>
                  Symmetric
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No templates in persisted store yet.</p>
      )}
    </div>
  )
}

export function FillingFlowPage({ mode, templateId, routeBase }: FillingFlowPageProps) {
  const router = useRouter()
  const templates = useFillingStore((state) => state.templates)
  const setFillingStep = useFillingStore((state) => state.setFillingStep)
  const setActiveTemplateId = useFillingStore((state) => state.setActiveTemplateId)
  const setEditingTemplateId = useFillingStore((state) => state.setEditingTemplateId)
  const initFillStatesForTemplate = useFillingStore((state) => state.initFillStatesForTemplate)
  const storeState = useFillingStore()

  const template = useMemo(() => templates.find((entry) => entry.id === templateId) ?? null, [templateId, templates])

  if (!template) {
    return (
      <div className="space-y-3 p-6">
        <h1 className="text-lg font-semibold">{toTitle(mode)}</h1>
        <p className="text-sm text-slate-500">Template not found.</p>
        <Link href={routeBase} className="text-sm text-sky-600 dark:text-sky-400">
          Back to template list
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">{toTitle(mode)}</h1>
          <p className="text-xs text-slate-500">{template.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => router.push(routeBase)}>
            Back
          </Button>
          <Button
            type="button"
            onClick={() => {
              setFillingStep(toFillingStep(mode))
              setActiveTemplateId(template.id)
              setEditingTemplateId(mode === "edit" ? template.id : null)
              initFillStatesForTemplate(template)
            }}
          >
            Activate flow
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-2 text-sm font-medium">Filling state snapshot</p>
        <pre className="max-h-[60vh] overflow-auto text-xs text-slate-600 dark:text-slate-300">
          {JSON.stringify(storeState, null, 2)}
        </pre>
      </div>
    </div>
  )
}
