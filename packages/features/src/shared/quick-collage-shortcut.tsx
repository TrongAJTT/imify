import React from "react";
import { LayoutGrid } from "lucide-react";
import { Button, EmptyDropCard } from "@imify/ui";
import { useTranslation } from "@imify/i18n";
import { APP_ROUTES } from "@imify/core/routes";

const urlRoute: string = APP_ROUTES.COLLAGE_MAKER;

export interface QuickCollageButtonProps {
  className?: string;
  onClick?: () => void;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "secondary" | "outline" | "default";
}

export function QuickCollageButton({
  className = "",
  onClick,
  size = "sm",
  variant = "secondary",
}: QuickCollageButtonProps) {
  const { t } = useTranslation("collageMaker");
  const label = t("title");

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (onClick) {
      onClick();
      return;
    }
    window.location.href = urlRoute;
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      title={label}
      className={className}
    >
      <LayoutGrid size={14} className="text-amber-500 shrink-0" />
      <span>{label}</span>
    </Button>
  );
}

export interface QuickCollageEmptyCardProps {
  className?: string;
  onClick?: () => void;
}

export function QuickCollageEmptyCard({
  className = "",
  onClick,
}: QuickCollageEmptyCardProps) {
  const { t } = useTranslation("collageMaker");
  const title = t("title");
  const subtitle = t("subtitle");

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    window.location.href = urlRoute;
  };

  return (
    <EmptyDropCard
      icon={<LayoutGrid size={28} className="text-amber-500" />}
      iconWrapperClassName="bg-amber-100 dark:bg-amber-900/30 border-transparent shadow-none"
      title={title}
      subtitle={subtitle}
      onClick={handleClick}
      className={className}
    />
  );
}
