import ignore from "ignore";

export function normalizePath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\/+/, "");
}

export function isMarkdownPath(path: string) {
  return normalizePath(path).toLowerCase().endsWith(".md");
}

export function globToRegExp(glob: string) {
  let pattern = normalizePath(glob.trim());

  if (pattern.endsWith("/")) {
    pattern += "**";
  }

  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "<<<DOUBLE_STAR>>>")
    .replace(/\*/g, "[^/]*")
    .replace(/<<<DOUBLE_STAR>>>/g, ".*");

  return new RegExp(`^${escaped}$`);
}

export function matchesGlob(path: string, pattern: string) {
  return globToRegExp(pattern).test(normalizePath(path));
}

export function matchesAnyGlob(path: string, patterns: string[]) {
  return patterns.some((pattern) => matchesGlob(path, pattern));
}

export function createIgnoreMatcher(ignoreRulesText: string) {
  const matcher = ignore();
  matcher.add(ignoreRulesText);
  return matcher;
}

export function filterTranslatablePaths(options: {
  paths: string[];
  includePatterns: string[];
  ignoreRulesText: string;
}) {
  const ignoreMatcher = createIgnoreMatcher(options.ignoreRulesText);

  return options.paths
    .map((path) => normalizePath(path))
    .filter((path) => isMarkdownPath(path))
    .filter((path) => !path.startsWith("translations/"))
    .filter((path) => matchesAnyGlob(path, options.includePatterns))
    .filter((path) => !ignoreMatcher.ignores(path));
}
