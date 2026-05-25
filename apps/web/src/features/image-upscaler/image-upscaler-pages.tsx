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
            <ImageUpscalerDropZone onLoadFile={(file) => void props.onLoadFile(file)} />
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
