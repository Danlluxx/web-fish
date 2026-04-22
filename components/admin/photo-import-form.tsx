"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type PhotoImportStatus = "idle" | "running" | "succeeded" | "failed";

interface PhotoImportCurrentStatus {
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

interface PhotoImportActiveArchive {
  sourceFileName: string;
  storedArchiveName: string;
  importedAt: string;
  articleCount: number;
  photoCount: number;
}

interface PhotoImportHistoryEntry {
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

interface PhotoImportFormProps {
  currentSourceFileName: string;
  importedAt: string;
  articleCount: number;
  photoCount: number;
  currentStatus: PhotoImportCurrentStatus;
  activeArchive: PhotoImportActiveArchive | null;
  history: PhotoImportHistoryEntry[];
  lastErrorEntry: PhotoImportHistoryEntry | null;
}

function formatAdminDate(value: string) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU", {
    timeZone: "Asia/Novosibirsk"
  });
}

function getStatusLabel(status: PhotoImportStatus) {
  switch (status) {
    case "running":
      return "Импорт идёт";
    case "succeeded":
      return "Успешно";
    case "failed":
      return "Ошибка";
    default:
      return "Ожидает запуск";
  }
}

function getStatusTone(status: PhotoImportStatus) {
  switch (status) {
    case "running":
      return "running";
    case "succeeded":
      return "success";
    case "failed":
      return "error";
    default:
      return "idle";
  }
}

async function parseAdminResponse(response: Response) {
  const raw = await response.text();

  try {
    return JSON.parse(raw) as {
      ok?: boolean;
      error?: string;
      sourceFileName?: string;
      storedArchiveName?: string;
      importedAt?: string;
      articleCount?: number;
      photoCount?: number;
    };
  } catch {
    if (response.status === 413) {
      return { error: "Архив слишком большой для текущей серверной настройки." };
    }

    if (response.status === 504) {
      return { error: "Сервер не успел завершить импорт. Попробуйте ещё раз чуть позже." };
    }

    return {
      error: raw.trim() || "Сервер вернул неожиданный ответ. Попробуйте повторить импорт."
    };
  }
}

export function PhotoImportForm({
  currentSourceFileName,
  importedAt,
  articleCount,
  photoCount,
  currentStatus,
  activeArchive,
  history,
  lastErrorEntry
}: PhotoImportFormProps) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [retryingArchiveName, setRetryingArchiveName] = useState("");

  const isBusy = isUploading || Boolean(retryingArchiveName);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setStatus("");

    if (!file) {
      setError("Выберите архив с фотографиями перед загрузкой.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("file", file);

      const response = await fetch("/api/admin/photos", {
        method: "POST",
        body: formData
      });
      const payload = await parseAdminResponse(response);

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Не удалось обновить фотографии.");
        return;
      }

      setStatus(
        `Фотографии обновлены: ${payload.photoCount ?? "—"} файлов для ${payload.articleCount ?? "—"} артикулов, источник ${payload.sourceFileName ?? file.name}.`
      );
      setFile(null);
      form.reset();
      router.refresh();
    } catch {
      setError("Ошибка загрузки архива. Проверьте соединение и повторите попытку.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRetry(storedArchiveName: string, sourceFileName: string) {
    setError("");
    setStatus("");

    if (!token.trim()) {
      setError("Введите токен администратора, чтобы повторить импорт архива.");
      return;
    }

    setRetryingArchiveName(storedArchiveName);

    try {
      const response = await fetch("/api/admin/photos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          storedArchiveName
        })
      });
      const payload = await parseAdminResponse(response);

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Не удалось повторить импорт архива.");
        return;
      }

      setStatus(
        `Повторный импорт завершён: ${payload.photoCount ?? "—"} файлов для ${payload.articleCount ?? "—"} артикулов, источник ${payload.sourceFileName ?? sourceFileName}.`
      );
      router.refresh();
    } catch {
      setError("Не удалось повторно импортировать архив. Попробуйте ещё раз.");
    } finally {
      setRetryingArchiveName("");
    }
  }

  return (
    <div className="admin-import-layout">
      <section className="catalog-hero">
        <div className="catalog-hero__header">
          <div>
            <span className="eyebrow">Обновление фотографий</span>
            <h1>Загрузка архива с фотографиями товаров</h1>
          </div>

          <div className="catalog-hero__stats">
            <div className="catalog-hero__stat">
              <strong>{articleCount}</strong>
              <span>артикулов с фотографиями</span>
            </div>
            <div className="catalog-hero__stat">
              <strong>{photoCount}</strong>
              <span>фотографий в текущей базе</span>
            </div>
            <div className="catalog-hero__stat">
              <strong>{currentSourceFileName}</strong>
              <span>последний загруженный архив</span>
            </div>
            <div className="catalog-hero__stat catalog-hero__stat--accent">
              <strong>{formatAdminDate(importedAt)}</strong>
              <span>время последнего импорта</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-import-panel">
        <div className="catalog-grid-section__header">
          <h2>Обновить фотографии товаров</h2>
          <p>
            Поддерживается архив `.zip`, внутри которого фотографии разложены по папкам
            артикулов. Для загрузки используется токен администратора.
          </p>
        </div>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <label className="checkout-form__field">
            <span>Токен администратора</span>
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Введите ADMIN_PHOTO_IMPORT_TOKEN"
              required
            />
          </label>

          <label className="checkout-form__field">
            <span>ZIP-архив с фотографиями</span>
            <input
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </label>

          {status ? <p className="admin-import__success">{status}</p> : null}
          {error ? <p className="checkout-form__error">{error}</p> : null}

          <button type="submit" className="button button--primary" disabled={isBusy}>
            {isUploading ? "Загружаем архив..." : "Загрузить и обновить фотографии"}
          </button>
        </form>
      </section>

      <section className="admin-import-grid">
        <article className="admin-import-panel admin-import-panel--compact">
          <div className="catalog-grid-section__header">
            <h2>Статус импорта</h2>
            <p>Показывает последний запуск и его итог, чтобы было понятно, что произошло на сервере.</p>
          </div>

          <div className="admin-status-card">
            <div className={`admin-status-badge admin-status-badge--${getStatusTone(currentStatus.status)}`}>
              {getStatusLabel(currentStatus.status)}
            </div>
            <dl className="admin-import-details">
              <div>
                <dt>Источник</dt>
                <dd>{currentStatus.sourceFileName || "—"}</dd>
              </div>
              <div>
                <dt>Старт</dt>
                <dd>{formatAdminDate(currentStatus.startedAt)}</dd>
              </div>
              <div>
                <dt>Завершение</dt>
                <dd>{formatAdminDate(currentStatus.finishedAt)}</dd>
              </div>
              <div>
                <dt>Результат</dt>
                <dd>
                  {currentStatus.photoCount > 0 || currentStatus.articleCount > 0
                    ? `${currentStatus.photoCount} фото / ${currentStatus.articleCount} артикулов`
                    : "—"}
                </dd>
              </div>
            </dl>
            {currentStatus.error ? (
              <p className="admin-import__failure">{currentStatus.error}</p>
            ) : null}
          </div>
        </article>

        <article className="admin-import-panel admin-import-panel--compact">
          <div className="catalog-grid-section__header">
            <h2>Текущий активный архив</h2>
            <p>Это именно тот архив, от которого сайт сейчас показывает фотографии на карточках товаров.</p>
          </div>

          {activeArchive ? (
            <div className="admin-status-card">
              <dl className="admin-import-details">
                <div>
                  <dt>Файл</dt>
                  <dd>{activeArchive.sourceFileName}</dd>
                </div>
                <div>
                  <dt>Активен с</dt>
                  <dd>{formatAdminDate(activeArchive.importedAt)}</dd>
                </div>
                <div>
                  <dt>Покрытие</dt>
                  <dd>
                    {activeArchive.photoCount} фото / {activeArchive.articleCount} артикулов
                  </dd>
                </div>
                <div>
                  <dt>Архив на сервере</dt>
                  <dd>{activeArchive.storedArchiveName || "Пока не сохранён в истории"}</dd>
                </div>
              </dl>
              {activeArchive.storedArchiveName ? (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() =>
                    handleRetry(activeArchive.storedArchiveName, activeArchive.sourceFileName)
                  }
                  disabled={isBusy || currentStatus.status === "running"}
                >
                  {retryingArchiveName === activeArchive.storedArchiveName
                    ? "Повторяем импорт..."
                    : "Повторить импорт"}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="admin-import__empty">
              Активный архив ещё не определён. После первого успешного импорта он появится здесь.
            </p>
          )}
        </article>
      </section>

      <section className="admin-import-panel">
        <div className="catalog-grid-section__header">
          <h2>История последних архивов</h2>
          <p>Здесь можно посмотреть недавние импорты, увидеть итог и при необходимости повторить запуск.</p>
        </div>

        {history.length > 0 ? (
          <div className="admin-import-history">
            {history.map((entry) => (
              <article key={entry.id} className="admin-import-history__item">
                <div className="admin-import-history__head">
                  <div>
                    <div className={`admin-status-badge admin-status-badge--${getStatusTone(entry.status)}`}>
                      {getStatusLabel(entry.status)}
                    </div>
                    <h3>{entry.sourceFileName}</h3>
                    <p>{entry.storedArchiveName}</p>
                  </div>

                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => handleRetry(entry.storedArchiveName, entry.sourceFileName)}
                    disabled={isBusy || entry.status === "running" || !entry.storedArchiveName}
                  >
                    {retryingArchiveName === entry.storedArchiveName
                      ? "Повторяем импорт..."
                      : "Повторить импорт"}
                  </button>
                </div>

                <dl className="admin-import-details">
                  <div>
                    <dt>Старт</dt>
                    <dd>{formatAdminDate(entry.startedAt)}</dd>
                  </div>
                  <div>
                    <dt>Завершение</dt>
                    <dd>{formatAdminDate(entry.finishedAt)}</dd>
                  </div>
                  <div>
                    <dt>Результат</dt>
                    <dd>
                      {entry.photoCount > 0 || entry.articleCount > 0
                        ? `${entry.photoCount} фото / ${entry.articleCount} артикулов`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Ошибка</dt>
                    <dd>{entry.error || "—"}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-import__empty">
            История импортов ещё пустая. После первого запуска сюда начнут записываться архивы.
          </p>
        )}
      </section>

      <section className="admin-import-panel">
        <div className="catalog-grid-section__header">
          <h2>Лог ошибок</h2>
          <p>Если импорт упал, здесь останется последнее сообщение сервера и вывод скрипта обработки.</p>
        </div>

        {lastErrorEntry ? (
          <div className="admin-import-log">
            <div className="admin-import-log__meta">
              <strong>{lastErrorEntry.sourceFileName}</strong>
              <span>{formatAdminDate(lastErrorEntry.finishedAt)}</span>
            </div>
            <p className="admin-import__failure">{lastErrorEntry.error}</p>
            <pre>{lastErrorEntry.log || lastErrorEntry.error}</pre>
          </div>
        ) : (
          <p className="admin-import__empty">
            Последний импорт завершился без ошибок. Когда что-то падает, подробности будут показаны здесь.
          </p>
        )}
      </section>
    </div>
  );
}
