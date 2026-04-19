"use client";

import { useState, type FormEvent } from "react";

interface PriceImportFormProps {
  currentSourceFileName: string;
  importedAt: string;
  productCount: number;
}

export function PriceImportForm({
  currentSourceFileName,
  importedAt,
  productCount
}: PriceImportFormProps) {
  const [token, setToken] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!file) {
      setError("Выберите Excel-файл перед загрузкой.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("file", file);

      const response = await fetch("/api/admin/price-list", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        productCount?: number;
        sourceFileName?: string;
        importedAt?: string;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Не удалось обновить прайс.");
        return;
      }

      setStatus(
        `Прайс обновлён: ${payload.productCount ?? "—"} товаров, источник ${payload.sourceFileName ?? file.name}.`
      );
      setFile(null);
      setToken("");
      event.currentTarget.reset();
    } catch {
      setError("Ошибка загрузки. Проверьте соединение и повторите попытку.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="admin-import-layout">
      <section className="catalog-hero">
        <div className="catalog-hero__header">
          <div>
            <span className="eyebrow">Обновление прайса</span>
            <h1>Загрузка нового Excel-прайса</h1>
          </div>

          <div className="catalog-hero__stats">
            <div className="catalog-hero__stat">
              <strong>{productCount}</strong>
              <span>товаров в текущем каталоге</span>
            </div>
            <div className="catalog-hero__stat">
              <strong>{currentSourceFileName}</strong>
              <span>последний загруженный файл</span>
            </div>
            <div className="catalog-hero__stat catalog-hero__stat--accent">
              <strong>{new Date(importedAt).toLocaleString("ru-RU")}</strong>
              <span>время последнего импорта</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-import-panel">
        <div className="catalog-grid-section__header">
          <h2>Обновить текущий прайс</h2>
          <p>Поддерживается `.xlsx`. Для безопасности используется токен администратора.</p>
        </div>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <label className="checkout-form__field">
            <span>Токен администратора</span>
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Введите ADMIN_PRICE_IMPORT_TOKEN"
              required
            />
          </label>

          <label className="checkout-form__field">
            <span>Excel-файл прайса</span>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </label>

          {status ? <p className="admin-import__success">{status}</p> : null}
          {error ? <p className="checkout-form__error">{error}</p> : null}

          <button type="submit" className="button button--primary" disabled={isUploading}>
            {isUploading ? "Загружаем..." : "Загрузить и обновить каталог"}
          </button>
        </form>
      </section>
    </div>
  );
}
