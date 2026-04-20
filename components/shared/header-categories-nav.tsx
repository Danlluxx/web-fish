"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { buildCatalogPath } from "@/lib/catalog/urls";
import type { CatalogSection } from "@/types/catalog";

interface HeaderCategoriesNavProps {
  priceListHref: string;
  sections: CatalogSection[];
}

export function HeaderCategoriesNav({ priceListHref, sections }: HeaderCategoriesNavProps) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const navColumns = sections.length + 1;

  const openSection = useMemo(
    () => sections.find((section) => section.slug === openSlug) ?? null,
    [openSlug, sections]
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenSlug(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenSlug(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="site-nav__wrapper" ref={rootRef} onMouseLeave={() => setOpenSlug(null)}>
      <nav
        className="site-nav site-nav--categories"
        aria-label="Категории каталога"
        data-items={navColumns}
        style={{ "--nav-columns": navColumns } as CSSProperties}
      >
        <a href={priceListHref} target="_blank" rel="noreferrer" className="site-nav__item site-nav__item--accent">
          <span>Прайс-лист</span>
        </a>

        {sections.map((section) => {
          const isOpen = openSlug === section.slug;

          return (
            <button
              key={section.slug}
              type="button"
              className={`site-nav__button ${isOpen ? "is-open" : ""}`}
              aria-expanded={isOpen}
              aria-controls={`header-subcategories-${section.slug}`}
              onMouseEnter={() => setOpenSlug(section.slug)}
              onFocus={() => setOpenSlug(section.slug)}
              onClick={() => setOpenSlug((current) => (current === section.slug ? null : section.slug))}
            >
              <span>{section.title}</span>
              <small aria-hidden="true">▾</small>
            </button>
          );
        })}
      </nav>

      {openSection ? (
        <div className="site-nav__dropdown" id={`header-subcategories-${openSection.slug}`}>
          <div className="site-nav__dropdown-inner">
            <div className="site-nav__dropdown-header">
              <strong>{openSection.title}</strong>
              <Link href={buildCatalogPath(openSection.slug)} className="site-nav__dropdown-all" onClick={() => setOpenSlug(null)}>
                Все товары категории
              </Link>
            </div>

            <div className="site-nav__dropdown-links">
              {openSection.subcategories.map((subcategory) => (
                <Link
                  key={subcategory.slug}
                  href={buildCatalogPath(openSection.slug, subcategory.slug)}
                  className="site-nav__dropdown-link"
                  onClick={() => setOpenSlug(null)}
                >
                  {subcategory.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
