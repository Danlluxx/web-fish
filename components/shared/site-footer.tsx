import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <div>
          <strong>{siteConfig.name}</strong>
          <p>Компактный каталог для быстрого просмотра рыб, растений, амфибий и беспозвоночных.</p>
        </div>

        <a href={siteConfig.priceListHref} target="_blank" rel="noreferrer" className="footer-link">
          Скачать Excel-прайс
        </a>
      </div>
    </footer>
  );
}
