"use client";

import { useState, type FormEvent } from "react";

import type { NewArrivalsState } from "@/lib/catalog/new-arrivals";

interface NewArrivalsImportFormProps {
  state: NewArrivalsState;
}

function formatAdminDate(value: string) {
  if (!value) {
    return "Не загружено";
  }

  return new Date(value).toLocaleString("ru-RU", {
    timeZone: "Asia/Novosibirsk"
  });
}

export function NewArrivalsImportForm({ state }: NewArrivalsImportFormProps) {
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
      setError("Выберите Excel-файл с новыми поступлениями.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("file", file);

      const response = await fetch("/api/admin/new-arrivals", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        sourceFileName?: string;
        sourceProductCount?: number;
        matchedCount?: number;
        missingCount?: number;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Не удалось обновить новые поступления.");
        return;
      }

      setStatus(
        `Новые поступления обновлены: найдено ${payload.matchedCount ?? 0} товаров из ${payload.sourceProductCount ?? "—"}, не сопоставлено ${payload.missingCount ?? 0}.`
      );
      setError("");
      setFile(null);
      setToken("");
      form.reset();
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
            <span className="eyebrow">Новые поступления</span>
            <h1>Загрузка отдельного Excel-списка</h1>
          </div>

          <div className="catalog-hero__stats">
            <div className="catalog-hero__stat">
              <strong>{state.matchedCount}</strong>
              <span>товаров показывается на главной</span>
            </div>
            <div className="catalog-hero__stat">
              <strong>{state.sourceFileName}</strong>
              <span>последний загруженный файл</span>
            </div>
            <div className="catalog-hero__stat catalog-hero__stat--accent">
              <strong>{formatAdminDate(state.importedAt)}</strong>
              <span>время последней загрузки</span>
            </div>
            <div className="catalog-hero__stat">
              <strong>{state.missingCount}</strong>
              <span>позиций не найдено в текущем каталоге</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-import-panel">
        <div className="catalog-grid-section__header">
          <h2>Обновить блок «Новые поступления»</h2>
          <p>
            Загрузите `.xlsx` со списком товаров. Сайт возьмёт из файла артикулы и покажет на
            главной только товары, которые есть в текущем каталоге.
          </p>
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
            <span>Excel-файл новых поступлений</span>
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
            {isUploading ? "Загружаем..." : "Загрузить новые поступления"}
          </button>
        </form>
      </section>

      {state.missingProducts.length > 0 ? (
        <section className="admin-import-panel">
          <div className="catalog-grid-section__header">
            <h2>Не найдено в текущем каталоге</h2>
            <p>
              Эти позиции были в Excel-файле, но не нашлись в текущем каталоге по артикулу или
              названию.
            </p>
          </div>

          <div className="admin-import-history">
            {state.missingProducts.slice(0, 20).map((product) => (
              <article className="admin-import-history__item" key={`${product.article}-${product.title}`}>
                <div className="admin-import-history__head">
                  <div>
                    <h3>{product.title}</h3>
                    <p>{product.article ?? "Артикул не найден в названии"}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
