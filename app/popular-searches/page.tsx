import type { Metadata } from "next";
import Link from "next/link";

import { getAquariumKeywordTerms } from "@/lib/seo/keyword-terms";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `Популярные запросы по аквариумным рыбам | ${siteConfig.name}`,
  description:
    "Популярные поисковые запросы по аквариумным рыбам, растениям, беспозвоночным и товарам каталога.",
  alternates: {
    canonical: `${siteConfig.siteUrl}/popular-searches`
  }
};

export default async function PopularSearchesPage() {
  const terms = await getAquariumKeywordTerms();

  return (
    <article className="seo-keywords-page">
      <header className="seo-keywords-hero">
        <span className="eyebrow">Поиск по каталогу</span>
        <h1>Популярные запросы</h1>
        <p>
          Здесь собраны поисковые фразы, по которым удобно быстро открыть каталог. Каждая ссылка ведет
          в каталог уже с выбранным запросом.
        </p>
      </header>

      <section className="seo-keywords-panel" aria-label="Список популярных поисковых запросов">
        <div className="seo-keywords-panel__header">
          <h2>Запросы для поиска</h2>
          <span>{terms.length} фраз</span>
        </div>

        {terms.length > 0 ? (
          <div className="seo-keyword-cloud">
            {terms.map((term, index) => (
              <Link
                key={`${term}-${index}`}
                href={{ pathname: "/catalog", query: { q: term } }}
                className="seo-keyword-chip"
              >
                {term}
              </Link>
            ))}
          </div>
        ) : (
          <p className="seo-keywords-empty">Список запросов пока не загружен.</p>
        )}
      </section>
    </article>
  );
}
