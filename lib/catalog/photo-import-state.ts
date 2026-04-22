import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getRuntimeProductMediaMeta } from "@/lib/catalog/media-data";

const STORAGE_DIR = path.join(process.cwd(), "storage");
const PHOTO_IMPORT_STATE_PATH = path.join(STORAGE_DIR, "photo-import-state.json");
const HISTORY_LIMIT = 8;

export type PhotoImportStatus = "idle" | "running" | "succeeded" | "failed";

export interface PhotoImportCurrentStatus {
  status: PhotoImportStatus;
  sourceFileName: string;
  storedArchiveName: string;
  startedAt: string;
  finishedAt: string;
  articleCount: number;
  photoCount: number;
  error: string;
  log: string;
}

export interface PhotoImportHistoryEntry {
  id: string;
  status: Exclude<PhotoImportStatus, "idle">;
  sourceFileName: string;
  storedArchiveName: string;
  startedAt: string;
  finishedAt: string;
  articleCount: number;
  photoCount: number;
  error: string;
  log: string;
}

interface PhotoImportStateFile {
  current?: PhotoImportCurrentStatus;
  history?: PhotoImportHistoryEntry[];
}

export interface PhotoImportActiveArchive {
  sourceFileName: string;
  storedArchiveName: string;
  importedAt: string;
  articleCount: number;
  photoCount: number;
}

export interface PhotoImportDashboard {
  currentSourceFileName: string;
  importedAt: string;
  articleCount: number;
  photoCount: number;
  currentStatus: PhotoImportCurrentStatus;
  activeArchive: PhotoImportActiveArchive | null;
  history: PhotoImportHistoryEntry[];
  lastErrorEntry: PhotoImportHistoryEntry | null;
}

export interface StartedPhotoImportAttempt {
  id: string;
  sourceFileName: string;
  storedArchiveName: string;
  startedAt: string;
}

function createEmptyCurrentStatus(): PhotoImportCurrentStatus {
  return {
    status: "idle",
    sourceFileName: "",
    storedArchiveName: "",
    startedAt: "",
    finishedAt: "",
    articleCount: 0,
    photoCount: 0,
    error: "",
    log: ""
  };
}

function normalizeCurrentStatus(
  value: PhotoImportCurrentStatus | null | undefined
): PhotoImportCurrentStatus {
  return {
    ...createEmptyCurrentStatus(),
    ...(value ?? {})
  };
}

function normalizeHistoryEntry(value: PhotoImportHistoryEntry): PhotoImportHistoryEntry {
  return {
    id: value.id,
    status: value.status,
    sourceFileName: value.sourceFileName ?? "",
    storedArchiveName: value.storedArchiveName ?? "",
    startedAt: value.startedAt ?? "",
    finishedAt: value.finishedAt ?? "",
    articleCount: value.articleCount ?? 0,
    photoCount: value.photoCount ?? 0,
    error: value.error ?? "",
    log: value.log ?? ""
  };
}

function createAttemptId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readPhotoImportStateFile(): Promise<PhotoImportStateFile> {
  try {
    const raw = await readFile(PHOTO_IMPORT_STATE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as PhotoImportStateFile;

    return {
      current: normalizeCurrentStatus(parsed.current),
      history: Array.isArray(parsed.history)
        ? parsed.history.map(normalizeHistoryEntry)
        : []
    };
  } catch {
    return {
      current: createEmptyCurrentStatus(),
      history: []
    };
  }
}

async function writePhotoImportStateFile(state: PhotoImportStateFile) {
  await mkdir(STORAGE_DIR, { recursive: true });
  await writeFile(
    PHOTO_IMPORT_STATE_PATH,
    `${JSON.stringify(
      {
        current: normalizeCurrentStatus(state.current),
        history: (state.history ?? []).slice(0, HISTORY_LIMIT).map(normalizeHistoryEntry)
      },
      null,
      2
    )}\n`
  );
}

export function buildPhotoImportLog(
  stdout: string | null | undefined,
  stderr: string | null | undefined,
  message?: string
) {
  const parts = [
    stdout?.trim() ? `stdout:\n${stdout.trim()}` : "",
    stderr?.trim() ? `stderr:\n${stderr.trim()}` : "",
    message?.trim() ? `message:\n${message.trim()}` : ""
  ].filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  return parts.join("\n\n").slice(0, 12000);
}

export async function startPhotoImportAttempt(
  sourceFileName: string,
  storedArchiveName: string
): Promise<StartedPhotoImportAttempt> {
  const state = await readPhotoImportStateFile();

  if (state.current?.status === "running") {
    throw new Error("Другой импорт фотографий уже выполняется. Дождитесь его завершения.");
  }

  const startedAt = new Date().toISOString();
  const attempt: PhotoImportHistoryEntry = {
    id: createAttemptId(),
    status: "running",
    sourceFileName,
    storedArchiveName,
    startedAt,
    finishedAt: "",
    articleCount: 0,
    photoCount: 0,
    error: "",
    log: ""
  };

  await writePhotoImportStateFile({
    current: {
      status: "running",
      sourceFileName,
      storedArchiveName,
      startedAt,
      finishedAt: "",
      articleCount: 0,
      photoCount: 0,
      error: "",
      log: ""
    },
    history: [attempt, ...(state.history ?? []).filter((entry) => entry.id !== attempt.id)].slice(
      0,
      HISTORY_LIMIT
    )
  });

  return {
    id: attempt.id,
    sourceFileName,
    storedArchiveName,
    startedAt
  };
}

export async function finishPhotoImportAttemptSuccess(
  attemptId: string,
  payload: {
    sourceFileName: string;
    storedArchiveName: string;
    importedAt: string;
    articleCount: number;
    photoCount: number;
    log: string;
  }
) {
  const state = await readPhotoImportStateFile();
  const history = (state.history ?? []).map((entry) =>
    entry.id === attemptId
      ? {
          ...entry,
          status: "succeeded" as const,
          sourceFileName: payload.sourceFileName,
          storedArchiveName: payload.storedArchiveName,
          finishedAt: payload.importedAt,
          articleCount: payload.articleCount,
          photoCount: payload.photoCount,
          error: "",
          log: payload.log
        }
      : entry
  );

  await writePhotoImportStateFile({
    current: {
      status: "succeeded",
      sourceFileName: payload.sourceFileName,
      storedArchiveName: payload.storedArchiveName,
      startedAt:
        history.find((entry) => entry.id === attemptId)?.startedAt ??
        state.current?.startedAt ??
        payload.importedAt,
      finishedAt: payload.importedAt,
      articleCount: payload.articleCount,
      photoCount: payload.photoCount,
      error: "",
      log: payload.log
    },
    history
  });
}

export async function finishPhotoImportAttemptFailure(
  attemptId: string,
  payload: {
    sourceFileName: string;
    storedArchiveName: string;
    finishedAt: string;
    error: string;
    log: string;
  }
) {
  const state = await readPhotoImportStateFile();
  const history = (state.history ?? []).map((entry) =>
    entry.id === attemptId
      ? {
          ...entry,
          status: "failed" as const,
          sourceFileName: payload.sourceFileName,
          storedArchiveName: payload.storedArchiveName,
          finishedAt: payload.finishedAt,
          error: payload.error,
          log: payload.log
        }
      : entry
  );
  const startedAt =
    history.find((entry) => entry.id === attemptId)?.startedAt ??
    state.current?.startedAt ??
    payload.finishedAt;

  await writePhotoImportStateFile({
    current: {
      status: "failed",
      sourceFileName: payload.sourceFileName,
      storedArchiveName: payload.storedArchiveName,
      startedAt,
      finishedAt: payload.finishedAt,
      articleCount: 0,
      photoCount: 0,
      error: payload.error,
      log: payload.log
    },
    history
  });
}

export async function findLatestPhotoImportEntryByArchive(storedArchiveName: string) {
  const state = await readPhotoImportStateFile();

  return (state.history ?? []).find((entry) => entry.storedArchiveName === storedArchiveName) ?? null;
}

export async function getPhotoImportDashboard(): Promise<PhotoImportDashboard> {
  const [state, runtimeMeta] = await Promise.all([
    readPhotoImportStateFile(),
    getRuntimeProductMediaMeta()
  ]);
  const history = (state.history ?? []).slice(0, HISTORY_LIMIT);
  const currentStatus = normalizeCurrentStatus(state.current);
  const activeMatch =
    history.find(
      (entry) =>
        entry.status === "succeeded" &&
        entry.sourceFileName === runtimeMeta.sourceFileName &&
        entry.finishedAt === runtimeMeta.importedAt
    ) ??
    history.find(
      (entry) =>
        entry.status === "succeeded" && entry.sourceFileName === runtimeMeta.sourceFileName
    ) ??
    null;

  const activeArchive =
    runtimeMeta.importedAt || runtimeMeta.sourceFileName !== "Фотографии ещё не загружались"
      ? {
          sourceFileName: runtimeMeta.sourceFileName,
          storedArchiveName: activeMatch?.storedArchiveName ?? "",
          importedAt: runtimeMeta.importedAt,
          articleCount: runtimeMeta.articleCount,
          photoCount: runtimeMeta.photoCount
        }
      : null;

  return {
    currentSourceFileName: runtimeMeta.sourceFileName,
    importedAt: runtimeMeta.importedAt,
    articleCount: runtimeMeta.articleCount,
    photoCount: runtimeMeta.photoCount,
    currentStatus,
    activeArchive,
    history,
    lastErrorEntry: history.find((entry) => entry.status === "failed") ?? null
  };
}
