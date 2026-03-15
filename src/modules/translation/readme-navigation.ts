import { getLanguageByCode } from "@/modules/catalog/bootstrap";

const START_MARKER = "<!-- gittrans:lang-switch:start -->";
const END_MARKER = "<!-- gittrans:lang-switch:end -->";

export function buildReadmeNavigation(targetLanguages: string[]) {
  const links = targetLanguages
    .map((code) => {
      const language = getLanguageByCode(code);

      if (!language) {
        return null;
      }

      return `[${language.englishName}](./translations/${code}/README.md)`;
    })
    .filter(Boolean)
    .join(" | ");

  return `${START_MARKER}
## 🌐 Translations
${links}
${END_MARKER}`;
}

function insertBlock(source: string, block: string) {
  const tocMatch = source.match(/^#{1,3}\s+(Table of Contents|目录|TOC).*$/im);

  if (tocMatch?.index !== undefined) {
    return `${source.slice(0, tocMatch.index).trimEnd()}\n\n${block}\n\n${source
      .slice(tocMatch.index)
      .trimStart()}`;
  }

  const firstHeadingMatch = source.match(/^# .+$/m);

  if (firstHeadingMatch?.index !== undefined) {
    const start = source.indexOf("\n", firstHeadingMatch.index);

    if (start !== -1) {
      return `${source.slice(0, start + 1).trimEnd()}\n\n${block}\n\n${source
        .slice(start + 1)
        .trimStart()}`;
    }
  }

  return `${block}\n\n${source.trimStart()}`;
}

export function updateReadmeNavigation(source: string, targetLanguages: string[]) {
  const block = buildReadmeNavigation(targetLanguages);

  if (source.includes(START_MARKER) && source.includes(END_MARKER)) {
    const regex = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, "m");
    return source.replace(regex, block);
  }

  return insertBlock(source, block);
}
