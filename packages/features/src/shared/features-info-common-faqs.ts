import { useTranslation } from "@imify/i18n";

export interface ShowcaseFaqItem {
  question: string
  answer: string
}

export const FEATURES_INFO_COMMON_FAQS: ShowcaseFaqItem[] = [
  {
    question: "What are common errors during processing?",
    answer: `The most common technical challenges include:
      • **bad_alloc** (Out of Memory): Occurs when your system lacks sufficient RAM to load the AI model. Try reloading the tab (if the current tab consumes too much memory) or using *Quantized* variants.
      • **WASM Memory Limit**: Browsers limit WebAssembly to 4GB regardless of your system RAM.
      • **QuotaExceededError**: Your browser's local storage or cache is full.
      • **Browser Resource Policy**: The browser may terminate the process if it consumes too much CPU for too long.
      Note: *Quantized* models are great for saving RAM, but **FP16** is usually faster on modern machines.`
  }
] as const;

export function getCommonFaqs(tFunc?: (key: string, options?: any) => any): ShowcaseFaqItem[] {
  if (tFunc) {
    const items = tFunc("common:commonFaqs", { returnObjects: true });
    if (Array.isArray(items)) return items;
  }
  return FEATURES_INFO_COMMON_FAQS as unknown as ShowcaseFaqItem[];
}

export function useCommonFaqs(): ShowcaseFaqItem[] {
  const { t } = useTranslation("common");
  return getCommonFaqs(t);
}