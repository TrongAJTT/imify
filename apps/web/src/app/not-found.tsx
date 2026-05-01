"use client"

import Link from "next/link"
import Image from "next/image"
import { Home, Image as ImageIcon, Search, ArrowLeft } from "lucide-react"
import { FEATURE_MEDIA_ASSETS } from "@imify/features/shared/media-assets"
import { Button } from "@imify/ui"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center min-h-[60vh]">
      <div className="relative mb-10 group">
        <div className="absolute inset-0 blur-3xl bg-sky-500/20 rounded-full transition-all group-hover:bg-sky-500/30" />
        <div className="relative flex items-center justify-center w-28 h-28 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 transition-transform group-hover:scale-105 duration-500 overflow-hidden">
          <Image
            src={FEATURE_MEDIA_ASSETS.brand.imifyLogoPng}
            alt="Imify Logo"
            width={64}
            height={64}
            className="object-contain opacity-10 grayscale brightness-0 dark:invert"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-12 h-12 text-slate-400 animate-pulse" />
          </div>
        </div>
        <div className="absolute -bottom-3 -right-3 bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-lg border border-slate-200 dark:border-slate-800 scale-110">
          <span className="text-2xl font-black text-sky-600 dark:text-sky-400">404</span>
        </div>
      </div>

      <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl mb-6">
        Missing Pixels?
      </h1>
      <p className="max-w-md text-xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
        The page you are looking for has been moved or doesn&apos;t exist. 
        Don&apos;t worry, our image tools are ready to help you elsewhere!
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full max-w-md px-6">
        <Button 
          variant="default" 
          size="lg" 
          className="flex-1 rounded-2xl h-14 text-base shadow-xl shadow-sky-500/10 active:scale-95 group/btn"
          asChild
        >
          <Link href="/" className="flex items-center justify-center gap-2">
            <Home className="w-5 h-5 transition-transform group-hover/btn:-translate-x-1" />
            <span>Back to Home</span>
          </Link>
        </Button>
        <Button 
          variant="secondary" 
          size="lg" 
          className="flex-1 rounded-2xl h-14 text-base active:scale-95 group/back"
          onClick={() => router.back()}
        >
          <div className="flex items-center justify-center gap-2">
            <ArrowLeft className="w-5 h-5 transition-transform group-hover/back:-translate-x-1" />
            <span>Go Back</span>
          </div>
        </Button>
      </div>

      <div className="mt-8">
        <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-sky-600 transition-colors">
          <Link href="/batch-processor" className="flex items-center justify-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span>Quickly Open Batch Processor</span>
          </Link>
        </Button>
      </div>

      <div className="mt-20 pt-8 border-t border-slate-200 dark:border-slate-800 w-full max-w-sm">
        <p className="text-sm text-slate-400 dark:text-slate-500 font-medium italic">
          &quot;The best image is the one you can find.&quot;
        </p>
      </div>
    </div>
  )
}
