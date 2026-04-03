type PublishedTaskItem = {
  filePath: string;
  language: string;
  status: "succeeded" | "failed";
};

export function collectPublishedReadmeLanguages(options: {
  targetLanguages: string[];
  items: PublishedTaskItem[];
}) {
  const publishedLanguages = new Set(
    options.items
      .filter((item) => item.filePath === "README.md")
      .filter((item) => item.status === "succeeded")
      .map((item) => item.language),
  );

  return options.targetLanguages.filter((language) => publishedLanguages.has(language));
}
