export type LanguageOption = {
  code: string;
  name: string;
  englishName: string;
};

export type ModelOption = {
  id: string;
  name: string;
  provider: "openrouter";
  recommended: boolean;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", name: "英语", englishName: "English" },
  { code: "zh-CN", name: "简体中文", englishName: "Simplified Chinese" },
  { code: "zh-TW", name: "繁体中文", englishName: "Traditional Chinese" },
  { code: "ja", name: "日语", englishName: "Japanese" },
  { code: "ko", name: "韩语", englishName: "Korean" },
  { code: "es", name: "西班牙语", englishName: "Spanish" },
  { code: "fr", name: "法语", englishName: "French" },
  { code: "de", name: "德语", englishName: "German" },
  { code: "pt", name: "葡萄牙语", englishName: "Portuguese" },
  { code: "ru", name: "俄语", englishName: "Russian" },
  { code: "ar", name: "阿拉伯语", englishName: "Arabic" },
  { code: "hi", name: "印地语", englishName: "Hindi" },
  { code: "it", name: "意大利语", englishName: "Italian" },
  { code: "nl", name: "荷兰语", englishName: "Dutch" },
  { code: "pl", name: "波兰语", englishName: "Polish" },
  { code: "tr", name: "土耳其语", englishName: "Turkish" },
  { code: "vi", name: "越南语", englishName: "Vietnamese" },
  { code: "th", name: "泰语", englishName: "Thai" },
  { code: "id", name: "印尼语", englishName: "Indonesian" },
  { code: "ms", name: "马来语", englishName: "Malay" }
];

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "openai/gpt-5.2",
    name: "GPT-5.2",
    provider: "openrouter",
    recommended: true
  }
];

export function getLanguageByCode(code: string) {
  return LANGUAGE_OPTIONS.find((item) => item.code === code);
}
