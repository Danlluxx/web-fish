import { readFile } from "node:fs/promises";
import path from "node:path";

const KEYWORD_FILE_NAME = "aquarium_keywords.txt";

export function normalizeKeywordTerms(content: string): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];

  for (const line of content.split(/\r?\n/)) {
    const term = line.trim().replace(/\s+/g, " ");
    const key = term.toLocaleLowerCase("ru-RU");

    if (!term || seen.has(key)) {
      continue;
    }

    seen.add(key);
    terms.push(term);
  }

  return terms;
}

export async function getAquariumKeywordTerms(): Promise<string[]> {
  try {
    const filePath = path.join(process.cwd(), KEYWORD_FILE_NAME);
    const content = await readFile(filePath, "utf8");

    return normalizeKeywordTerms(content);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: string }).code
        : undefined;

    if (code === "ENOENT") {
      return [];
    }

    throw error;
  }
}
