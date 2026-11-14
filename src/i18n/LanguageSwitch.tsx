"use client";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useT } from "./I18nProvider";

/** One tap switches between English and Amharic. The label is written in the other language. */
export function LanguageSwitch({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { t, locale, setLocale } = useT();
  const other = locale === "am" ? "en" : "am";
  const button = <Button variant="ghost" size={compact ? "icon" : "sm"} className={cn("gap-1.5", className)}
    aria-label={t("lang.switchLabel")} lang={other} onClick={() => setLocale(other)}>
    <Languages className="size-4" />{!compact && <span>{t("lang.switch")}</span>}
  </Button>;
  if (!compact) return button;
  return <Tooltip>
    <TooltipTrigger asChild>{button}</TooltipTrigger>
    <TooltipContent lang={other}>{t("lang.switch")}</TooltipContent>
  </Tooltip>;
}
