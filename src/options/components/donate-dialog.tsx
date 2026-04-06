import React from "react"
import { Heart, X } from "lucide-react"
import { Button } from "@/options/components/ui/button"
import { BaseDialog } from "@/options/components/ui/base-dialog"

import bmcLogo from "url:assets/images/bmc-logo.svg"
import githubLogo from "url:assets/images/github-logo.svg"

interface DonateDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const DonateDialog: React.FC<DonateDialogProps> = ({ isOpen, onClose }) => {
  return (
    <BaseDialog isOpen={isOpen} onClose={onClose} contentClassName="w-full max-w-xl rounded-2xl p-8">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 mb-6 group transition-transform hover:scale-110 duration-300">
          <Heart size={32} className="animate-pulse fill-current" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Support the Developer</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-md mx-auto">
          Thank you for using Imify! If you find it helpful, consider supporting the developer to help keep the project alive and free for everyone.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all hover:shadow-md" href="https://github.com/sponsors/TrongAJTT" rel="noreferrer" target="_blank">
            <img src={githubLogo} alt="GitHub" className="w-5 h-5 flex-shrink-0 brightness-0 dark:invert" />
            <span className="truncate">Sponsor me on GitHub</span>
          </a>
          <a className="flex items-center justify-center gap-2 rounded-xl border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/30 px-3 py-3 text-sm font-semibold text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-all hover:shadow-md h-full" href="https://www.buymeacoffee.com/TrongAJTT" rel="noreferrer" target="_blank">
            <img src={bmcLogo} alt="Buy Me A Coffee" className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">Buy Me A Coffee</span>
          </a>
        </div>
      </div>
    </BaseDialog>
  )
}

export default DonateDialog
