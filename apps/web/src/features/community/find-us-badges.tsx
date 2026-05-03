import React from "react"
import { cn } from "@imify/ui/ui/utils"
import { FEATURE_MEDIA_ASSETS, resolveFeatureMediaAssetUrl } from "@imify/features/shared/media-assets"

interface CustomBadgeProps {
  href: string
  icon: string
  label: string
  brandName: string
  primaryColor: string 
  className?: string
}

export const CustomBadge: React.FC<CustomBadgeProps> = ({
  href,
  icon,
  label,
  brandName,
  primaryColor,
  className
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center h-[48px] w-[222px] rounded-xl border-2 transition-all hover:-translate-y-0.5 overflow-hidden group mx-auto md:mx-0",
        "bg-white dark:bg-slate-950",
        className
      )}
      style={{
        borderColor: primaryColor,
        color: primaryColor
      }}
    >
      <div 
        className="flex items-center justify-center h-full aspect-square border-r-2 shrink-0"
        style={{ borderColor: primaryColor }}
      >
        <img src={icon} alt={brandName} className="w-6 h-6 object-contain" />
      </div>
      <div className="flex flex-col px-3 justify-center min-w-0">
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
        href="https://www.producthunt.com/products/imiy?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-imiy"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-all hover:-translate-y-0.5 block h-12 w-full max-w-[222px]"
      >
        <img
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1136860&theme=light&t=1777818024037"
          alt="Imiy - The powerful image toolkit for designers | Product Hunt"
          style={{ height: "48px" }}
          height="48"
          className="block dark:hidden h-12 w-full object-contain"
        />
        <img
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1136860&theme=dark&t=1777818034186"
          alt="Imiy - The powerful image toolkit for designers | Product Hunt"
          style={{ height: "48px" }}
          height="48"
          className="hidden dark:block h-12 w-full object-contain"
        />
      </a>
    </div>
  )
}

export const FindOnUnikornBadge: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <CustomBadge
      href="https://unikorn.vn/p/imify"
      icon="https://unikorn.vn/favicon.ico"
      label="Find us on"
      brandName="Unikorn"
      primaryColor="#00b894"
      className={className}
    />
  )
}

export const FindOnJ2TeamLaunchBadge: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <CustomBadge
      href="https://launch.j2team.dev/products/imify-save-process-images"
      icon={resolveFeatureMediaAssetUrl(FEATURE_MEDIA_ASSETS.brand.j2teamLogoIco)}
      label="Find us on"
      brandName="J2TEAM Launch"
      primaryColor="#1a73e8"
      className={className}
    />
  )
}
