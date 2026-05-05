import React from "react"
import Image from "next/image"
import { cn } from "@imify/ui/ui/utils"
import { FEATURE_MEDIA_ASSETS, resolveFeatureMediaAssetUrl } from "@imify/features/shared/media-assets"
import { IMIFY_LINKS } from "@imify/core/links"

interface CustomBadgeProps {
  href: string
  icon: string
  label: string
  brandName: string
  colorClassName: string
  iconClassName?: string
  className?: string
}

export const CustomBadge: React.FC<CustomBadgeProps> = ({
  href,
  icon,
  label,
  brandName,
  colorClassName,
  iconClassName,
  className
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center h-[48px] w-[222px] rounded-xl border transition-all hover:-translate-y-0.5 overflow-hidden group mx-auto md:mx-0",
        "bg-white dark:bg-slate-950",
        colorClassName,
        className
      )}
    >
      <div className="flex items-center justify-center h-full aspect-square shrink-0">
        <Image
          src={icon}
          alt={brandName}
          width={24}
          height={24}
          className={cn("object-contain", iconClassName)}
        />
      </div>
      <div className="flex flex-col px-1 justify-center min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 leading-none mb-1 truncate">
          {label}
        </span>
        <span className="text-[15px] font-bold leading-tight whitespace-nowrap">
          {brandName}
        </span>
      </div>
    </a>
  )
}

export const FindOnProductHuntBadge: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("flex items-center justify-center md:justify-start", className)}>
      <a
        href={IMIFY_LINKS.productHunt}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-all hover:-translate-y-0.5 block h-12 w-[222px]"
      >
        <Image
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1136860&theme=light&t=1777818024037"
          alt="Imiy - The powerful image toolkit for designers | Product Hunt"
          width={222}
          height={48}
          className="block dark:hidden h-12 w-[222px] object-contain"
        />
        <Image
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1136860&theme=dark&t=1777818034186"
          alt="Imiy - The powerful image toolkit for designers | Product Hunt"
          width={222}
          height={48}
          className="hidden dark:block h-12 w-[222px] object-contain"
        />
      </a>
    </div>
  )
}

export const FindOnUnikornBadge: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <CustomBadge
      href={IMIFY_LINKS.unikorn}
      icon="https://unikorn.vn/favicon.ico"
      label="Find us on"
      brandName="Unikorn"
      colorClassName="border-slate-800 text-slate-800 dark:border-white dark:text-white"
      iconClassName="dark:invert"
      className={className}
    />
  )
}

export const FindOnJ2TeamLaunchBadge: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <CustomBadge
      href={IMIFY_LINKS.j2teamLaunch}
      icon={resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.brand.j2teamLogoIco)}
      label="Find us on"
      brandName="J2TEAM Launch"
      colorClassName="border-[#f43f5e] text-[#f43f5e]"
      className={className}
    />
  )
}
