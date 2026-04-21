"use client";

import { useState, type FormEvent } from "react";

interface PhotoImportFormProps {
  currentSourceFileName: string;
  importedAt: string;
  articleCount: number;
  photoCount: number;
}

export function PhotoImportForm({
  currentSourceFileName,
  importedAt,
  articleCount,
  photoCount
}: PhotoImportFormProps) {
  const [token, setToken] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        sourceFileName?: string;
        importedAt?: string;
        articleCount?: number;
        photoCount?: number;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Не удалось обновить фотографии.");
        return;
      }

      setStatus(
        `Фотографии обновлены: ${payload.photoCount ?? "—"} файлов для ${payload.articleCount ?? "—"} артикулов, источник ${payload.sourceFileName ?? file.name}.`
      );
      setFile(null);
      setToken("");
      form.reset();
    } catch {
      setError("Ошибка загрузки архива. Проверьте соединение и повторите попытку.");
    } finally {
      setIsUploading(false);
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
              <strong>
                {importedAt
                  ? new Date(importedAt).toLocaleString("ru-RU", {
                      timeZone: "Asia/Novosibirsk"
                    })
                  : "—"}
              </strong>
              <span>время последнего импорта</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-import-panel">
        <div className="catalog-grid-section__header">
          <h2>Обновить фотографии товаров</h2>
          <p>
            Поддерживается архив `.zip`, внутри которого фотографии разложены по папкам артикулов.
            Для загрузки используется токен администратора.
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

          <button type="submit" className="button button--primary" disabled={isUploading}>
            {isUploading ? "Загружаем архив..." : "Загрузить и обновить фотографии"}
          </button>
        </form>
      </section>
    </div>
  );
}

