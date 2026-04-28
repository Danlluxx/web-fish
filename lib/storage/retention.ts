import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

interface StoredFileEntry {
  name: string;
  filePath: string;
  mtimeMs: number;
}

async function readStoredFiles(directoryPath: string): Promise<StoredFileEntry[]> {
  try {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const filePath = path.join(directoryPath, entry.name);
          const fileStats = await stat(filePath);

          return {
            name: entry.name,
            filePath,
            mtimeMs: fileStats.mtimeMs
          };
        })
    );

    return files.sort(
      (left, right) => right.mtimeMs - left.mtimeMs || right.name.localeCompare(left.name)
    );
  } catch {
    return [];
  }
}

export async function pruneStoredFiles(
  directoryPath: string,
  keepLatest: number
): Promise<string[]> {
  if (keepLatest < 1) {
    return [];
  }

  const files = await readStoredFiles(directoryPath);
  const filesToRemove = files.slice(keepLatest);

  await Promise.all(filesToRemove.map((file) => rm(file.filePath, { force: true })));

  return filesToRemove.map((file) => file.name);
}
