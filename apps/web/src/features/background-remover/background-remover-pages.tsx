"use client"

import React from "react"
import { 
  SharedBackgroundRemoverPage, 
  BackgroundRemoverWorkspace, 
  BackgroundRemoverDropZone,
  BackgroundRemoverSidebarShell 
} from "@imify/features/background-removal"

import { useWorkspaceHeaderStore } from "@imify/stores/stores/workspace-header-store"
import { FeatureBreadcrumb } from "@imify/features/shared/feature-breadcrumb"
import { useWorkspaceSidebar } from "@/components/layout/workspace-layout"
import { useRouter } from "next/navigation"

export function BackgroundRemoverPage() {
  const router = useRouter()
  const setHeaderSection = useWorkspaceHeaderStore((state) => state.setSection)
  const setHeaderBreadcrumb = useWorkspaceHeaderStore((state) => state.setBreadcrumb)
  const resetHeader = useWorkspaceHeaderStore((state) => state.resetHeader)

  // Register sidebar shell
  useWorkspaceSidebar(<BackgroundRemoverSidebarShell />)

  React.useEffect(() => {
    setHeaderSection("Background Remover")
    setHeaderBreadcrumb(
      <FeatureBreadcrumb 
        compact 
        rootToolId="background-remover" 
        onRootClick={() => router.push("/background-remover")}
      />
    )
    return () => resetHeader()
  }, [resetHeader, router, setHeaderBreadcrumb, setHeaderSection])

  return (
    <SharedBackgroundRemoverPage
      renderWorkspace={(props) => (
        <>
          {!props.sourceFile ? (
            <BackgroundRemoverDropZone onLoadFile={(file) => void props.onLoadFile(file)} />
          ) : (
            props.sourceImageData ? (
              <BackgroundRemoverWorkspace
                sourceFile={props.sourceFile}
                sourceImageData={props.sourceImageData}
                resultImageData={props.resultImageData}
                isProcessing={props.isProcessing}
                progressPayload={props.progressPayload}
                onClear={props.onClear}
                onStartProcessing={props.onStartProcessing}
              />
            ) : null // Or loading spinner
          )}
        </>
      )}
    />
  )
}
