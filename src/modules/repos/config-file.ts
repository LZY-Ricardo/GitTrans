import YAML from "yaml";

export function buildGitTransConfigFile(options: {
  repo: string;
  baseBranch: string;
  baseLanguage: string;
  targetLanguages: string[];
  includePaths: string[];
  modelId: string;
  outputRoot: string;
  readmeNavigationEnabled: boolean;
  translationBranch: string;
}) {
  return YAML.stringify({
    repo: options.repo,
    baseBranch: options.baseBranch,
    baseLanguage: options.baseLanguage,
    targetLanguages: options.targetLanguages,
    include: options.includePaths,
    ignoreFile: ".github-global-ignore",
    outputRoot: options.outputRoot,
    model: {
      provider: "openrouter",
      id: options.modelId
    },
    readmeNavigation: {
      enabled: options.readmeNavigationEnabled
    },
    pullRequest: {
      branch: options.translationBranch,
      titleTemplate: "docs: update translations"
    }
  });
}
