"use client"

import React from "react"
import { Heart, X } from "lucide-react"
import { BaseDialog } from "@imify/ui/ui/base-dialog"
import { Button } from "@imify/ui/ui/button"
import { IconLeadingButton } from "@imify/ui/ui/icon-leading-button"
import { Subheading, MutedText } from "@imify/ui/ui/typography"
import { FEATURE_MEDIA_ASSETS, resolveFeatureMediaAssetUrl } from "../shared/media-assets"

interface DonateDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function DonateDialog({
  isOpen,
  onClose
}: DonateDialogProps) {
  const githubLogoSrc = resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.brand.githubLogoSvg)
  const buyMeCoffeeLogoSrc = resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.brand.buyMeCoffeeLogoSvg)
  return (
    <BaseDialog isOpen={isOpen} onClose={onClose} contentClassName="w-full max-w-xl rounded-2xl p-8">
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 rounded-full border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        onClick={onClose}
      >
        <X size={16} />
      </Button>
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 mb-6 motion-safe:animate-[pulse_1.6s_ease-in-out_infinite]">
          <Heart size={30} className="fill-current" />
        </div>
        <Subheading className="mb-3 text-2xl font-bold">Support the Developer</Subheading>
        <MutedText className="mb-8 max-w-md leading-relaxed mx-auto">
          Thank you for using Imify! If it helps your work, your support helps keep this project alive and free.
        </MutedText>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <IconLeadingButton
            className="w-full border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            leadingClassName="border-slate-300 bg-slate-100 text-slate-700"
            leadingIcon={
              <img src={githubLogoSrc} alt="GitHub" className="h-5 w-5 shrink-0 brightness-0" />
            }
            href="https://github.com/sponsors/TrongAJTT"
            rel="noreferrer"
            target="_blank"
          >
            Sponsor me on GitHub
          </IconLeadingButton>
          <IconLeadingButton
            className="w-full border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950/30 dark:text-yellow-300 dark:hover:bg-yellow-900/40"
            leadingClassName="border-yellow-200 bg-yellow-100"
            leadingIcon={
              <img src={buyMeCoffeeLogoSrc} alt="Buy Me A Coffee" className="h-5 w-5 shrink-0" />
            }
            href="https://www.buymeacoffee.com/TrongAJTT"
            rel="noreferrer"
            target="_blank"
          >
            Buy Me A Coffee
          </IconLeadingButton>
        </div>
      </div>
    </BaseDialog>
  )
}
