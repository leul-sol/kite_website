"use client";
import { useCallback } from "react";
import { en } from "./en";
import { useT } from "./I18nProvider";
import type { MessageKey } from "./translate";

/** Names for data that comes from the server: known ones are translated, others shown as sent. */
export function useCategoryName() {
  const { t } = useT();
  return useCallback((id: string, fallback: string) => {
    const key = `category.${id.toLowerCase()}`;
    return key in en ? t(key as MessageKey) : fallback;
  }, [t]);
}

/** A booking status such as "PICKED_UP" in the reader's language. */
export function useStatusLabel() {
  const { t } = useT();
  return useCallback((status: string) => {
    const key = `status.${status}`;
    return key in en ? t(key as MessageKey) : status.toLowerCase().replaceAll("_", " ");
  }, [t]);
}
