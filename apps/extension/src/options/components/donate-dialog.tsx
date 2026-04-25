import React from "react"
import { Heart } from "lucide-react"
import { BaseDialog } from "@imify/ui/ui/base-dialog"
import { IconLeadingButton } from "@imify/ui/ui/icon-leading-button"
import { Subheading, MutedText } from "@imify/ui/ui/typography"

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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 mb-6 group transition-transform hover:scale-110 duration-300 motion-safe:animate-[pulse_1.6s_ease-in-out_infinite]">
          <Heart size={32} className="fill-current" />
        </div>
        <Subheading className="mb-3 text-2xl font-bold">Support the Developer</Subheading>
        <MutedText className="mb-8 max-w-md mx-auto leading-relaxed">
          Thank you for using Imify! If you find it helpful, consider supporting the developer to help keep the project alive and free for everyone.
        </MutedText>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <IconLeadingButton
            className="w-full border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:shadow-md dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            leadingClassName="border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
            leadingIcon={<img src={githubLogo} alt="GitHub" className="h-5 w-5 flex-shrink-0 brightness-0 dark:invert" />}
            href="https://github.com/sponsors/TrongAJTT"
            rel="noreferrer"
            target="_blank"
          >
            <span className="truncate">Sponsor me on GitHub</span>
          </IconLeadingButton>
          <IconLeadingButton
            className="h-full w-full border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:shadow-md dark:bg-yellow-950/30 dark:text-yellow-300 dark:hover:bg-yellow-900/40"
            leadingClassName="border-yellow-200 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
            leadingIcon={<img src={bmcLogo} alt="Buy Me A Coffee" className="h-5 w-5 flex-shrink-0" />}
            href="https://www.buymeacoffee.com/TrongAJTT"
            rel="noreferrer"
            target="_blank"
          >
            <span className="truncate">Buy Me A Coffee</span>
          </IconLeadingButton>
        </div>
      </div>
    </BaseDialog>
  )
}

export default DonateDialog
