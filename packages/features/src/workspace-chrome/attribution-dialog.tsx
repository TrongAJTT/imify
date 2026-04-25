"use client"

import React from "react"
import { ExternalLink, X } from "lucide-react"
import { ATTRIBUTIONS } from "@imify/core/attributions"
import { Button } from "@imify/ui/ui/button"
import { BaseDialog } from "@imify/ui/ui/base-dialog"
import { Tooltip } from "../shared/tooltip"

interface AttributionDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function AttributionDialog({ isOpen, onClose }: AttributionDialogProps) {
  return (
    <BaseDialog isOpen={isOpen} onClose={onClose} contentClassName="w-full max-w-3xl rounded-lg p-8">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />
      <Button
        variant="outline"
        size="icon"
        className="absolute top-6 right-6 rounded-full border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all z-10"
        onClick={onClose}
      >
        <X size={18} />
      </Button>
      <div className="flex flex-col gap-1 mb-8">
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Acknowledgements</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Imify is proud to be built using the following open-source technologies.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar py-1">
        {ATTRIBUTIONS.map((item) => (
          <Tooltip
            key={item.name}
            label={item.name}
            content={`● By: ${item.author}\n● License: ${item.license}`}
            variant="wide1"
          >
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col p-4 rounded-md border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-950/20 hover:border-sky-500/50 hover:bg-sky-500/5 hover:-translate-y-1 transition-all duration-300 group shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-[13px] tracking-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors uppercase truncate pr-2">
                  {item.name}
                </span>
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center shrink-0 group-hover:bg-sky-500/10 transition-colors">
                  <ExternalLink size={10} className="text-slate-400 group-hover:text-sky-500 transition-colors" />
                </div>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold truncate">
                BY {item.author.toUpperCase()}
              </span>
            </a>
          </Tooltip>
        ))}
      </div>
    </BaseDialog>
  )
}
