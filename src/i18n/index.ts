import { useFireStore } from "../data/fireStore";
import type { FireSnapshot } from "../features/types";
import { en } from "./en";
import { zhHant } from "./zhHant";

export const dictionaries = {
  en,
  zhHant,
};

export function getI18n(language: FireSnapshot["language"] | undefined) {
  return language === "zhHant" ? zhHant : en;
}

export function useI18n() {
  const { snapshot } = useFireStore();
  return getI18n(snapshot.language);
}
