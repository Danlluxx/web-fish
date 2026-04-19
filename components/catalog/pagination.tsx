import Link from "next/link";

interface PaginationProps {
  basePath: string;
  page: number;
  totalPages: number;
  query?: string;
}

function buildHref(basePath: string, page: number, query?: string): string {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (query) {
    params.set("q", query);
  }

  const suffix = params.toString();
  return suffix ? `${basePath}?${suffix}` : basePath;
}

export function Pagination({ basePath, page, totalPages, query }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).slice(
    Math.max(page - 3, 0),
    Math.max(page - 3, 0) + 6
  );

  return (
    <nav className="pagination" aria-label="Пагинация каталога">
      <Link
        href={buildHref(basePath, Math.max(page - 1, 1), query)}
        className={`pagination__button ${page === 1 ? "is-disabled" : ""}`}
        aria-disabled={page === 1}
      >
        Назад
      </Link>

      <div className="pagination__pages">
        {pages.map((item) => (
          <Link
            key={item}
            href={buildHref(basePath, item, query)}
            className={`pagination__page ${item === page ? "is-active" : ""}`}
          >
            {item}
          </Link>
        ))}
      </div>

      <Link
        href={buildHref(basePath, Math.min(page + 1, totalPages), query)}
        className={`pagination__button ${page === totalPages ? "is-disabled" : ""}`}
        aria-disabled={page === totalPages}
      >
        Далее
      </Link>
    </nav>
  );
}
