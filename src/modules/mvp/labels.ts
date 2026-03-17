import { getLanguageByCode } from "@/modules/catalog/bootstrap";

export function getLanguageLabel(code: string) {
  const language = getLanguageByCode(code);
  return language ? `${language.name} · ${language.englishName}` : code;
}
