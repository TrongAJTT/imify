"use client"

import React from "react"
import { 
  SharedImageUpscalerPage, 
  ImageUpscalerWorkspace, 
  ImageUpscalerDropZone,
  ImageUpscalerSidebarShell
} from "@imify/features/image-upscaler"

import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"
import { useRouter } from "next/navigation"
import { useWideSidebarGridEnabled } from "@/hooks/use-wide-sidebar-grid"

function ImageUpscalerHardwareNoticeCard() {
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/5">
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
        Bring the power of AI models to your browser.
      </div>
      <div className="mt-2 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          This feature can be hardware-sensitive, so we recommend a machine with a strong CPU, a discrete GPU, and at least 16GB of RAM.
        </p>
        <p>
          Use it patiently if you only need it occasionally. For frequent use, we recommend dedicated native apps such as Upscayl.
        </p>
      </div>
    </div>
  )
}

export function ImageUpscalerPage() {
  const router = useRouter()
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)
  const enableWideSidebarGrid = useWideSidebarGridEnabled()

  // Register sidebar shell
  useWorkspaceSidebar(<ImageUpscalerSidebarShell enableWideSidebarGrid={enableWideSidebarGrid} />)

  React.useEffect(() => {
    setHeaderSection("Image Upscaler")
    setHeaderBreadcrumb(
      <FeatureBreadcrumb 
        compact 
        rootToolId="image-upscaler" 
        onRootClick={() => router.push("/image-upscaler")}
      />
    )
    return () => resetHeader()
  }, [resetHeader, router, setHeaderBreadcrumb, setHeaderSection])

  return (
    <SharedImageUpscalerPage
      renderWorkspace={(props) => (
        <>
          {!props.sourceFile ? (
            <div className="space-y-4">
              <ImageUpscalerDropZone onLoadFile={(file) => void props.onLoadFile(file)} />
              <ImageUpscalerHardwareNoticeCard />
            </div>
          ) : (
            props.sourceImageData ? (
              <ImageUpscalerWorkspace
                sourceFile={props.sourceFile}
                sourceImageData={props.sourceImageData}
                resultImageData={props.resultImageData}
                isProcessing={props.isProcessing}
                progressPayload={props.progressPayload}
                onClear={props.onClear}
                onStartProcessing={props.onStartProcessing}
                modelId={props.modelId}
              />
            ) : null // Or loading spinner
          )}
        </>
      )}
    />
  )
}
