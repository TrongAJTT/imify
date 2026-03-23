import { Button } from "@/options/components/ui/button"
import { useKeyPress } from "@/options/hooks/use-key-press"
import { Heart, X } from "lucide-react"
import React from "react"

import { Tooltip } from "./tooltip"

interface AboutDialogProps {
  isOpen: boolean
  onClose: () => void
  onOpenAttribution: () => void
}

export const AboutDialog: React.FC<AboutDialogProps> = ({
  isOpen,
  onClose,
  onOpenAttribution
}) => {
  useKeyPress("Escape", onClose, isOpen)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 rounded-full border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 z-10"
          onClick={() => onClose()}
          aria-label="Close about dialog">
          <X size={16} />
        </Button>

        <div className="flex flex-col">
          <div className="flex items-center gap-5 mb-8">
            <img
              src={require("url:@assets/icon.png")}
              alt="Imify Logo"
              className="w-20 h-20 rounded-2xl shadow-md rotate-3 bg-white p-1"
            />
            <div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Imify
              </h3>
              <p className="text-sm text-sky-500 dark:text-sky-400 uppercase tracking-widest font-bold">
                Save and Process images
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">
                  v1.0.0
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Stable
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-600 dark:text-slate-300">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                About the project
              </h4>
              <p className="text-sm leading-relaxed">
                Imify was born out of a simple need:{" "}
                <span className="text-slate-900 dark:text-white font-medium">
                  Privacy-First
                </span>{" "}
                image processing. Unlike online converters that upload your data
                to remote servers, Imify handles every single byte{" "}
                <span className="text-slate-900 dark:text-white font-medium">
                  locally
                </span>{" "}
                right in your browser memory.
              </p>
              <p className="text-sm leading-relaxed">
                Built for developers, designers, and privacy enthusiasts who
                need quick, reliable, and secure image formatting without
                compromise.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                Key Technologies
              </h4>
              <ul className="grid grid-cols-1 gap-2">
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                  <span>Plasmo Extension Framework</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                  <span>OffscreenCanvas API</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                  <span>Modern AVIF & PDF Engines</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                  <span>React + Tailwind CSS</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none">
                  A project by
                </p>
                <a
                  href="https://github.com/TrongAJTT"
                  target="_blank"
                  rel="noreferrer"
                  className="text-lg text-slate-900 dark:text-white font-bold hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                  TrongAJTT
                </a>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                <Tooltip content="Open Source Licenses" variant="nowrap">
                  <button
                    type="button"
                    onClick={() => onOpenAttribution()}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
                    Attribution
                  </button>
                </Tooltip>
                <Tooltip content="View Github repo of Imify" variant="nowrap">
                  <a
                    href="https://github.com/TrongAJTT/imify"
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-bold shadow-lg shadow-slate-900/10 dark:shadow-none hover:-translate-y-0.5 transition-all flex items-center gap-2">
                    Repository
                  </a>
                </Tooltip>
                <Tooltip content="View Author's Apps" variant="nowrap">
                  <a
                    href="https://www.trongajtt.com/apps"
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
                    More Apps
                  </a>
                </Tooltip>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                <a
                  href="https://www.trongajtt.com/apps/imify/terms/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                  Terms of Use
                </a>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <a
                  href="https://www.trongajtt.com/apps/imify/policy/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
