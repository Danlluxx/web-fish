import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import { MaxBrandIcon, TelegramBrandIcon } from "@/components/shared/site-icons";
import { siteConfig } from "@/lib/site";

interface InfoPageAction {
  href: string;
  label: string;
  external?: boolean;
}

interface InfoPageCard {
  title: string;
  text: ReactNode;
}

interface InfoPageSection {
  title: string;
  text?: ReactNode;
  cards?: InfoPageCard[];
  list?: string[];
}

interface InfoPageProps {
  eyebrow: string;
  title: string;
  lead: string;
  icon: ComponentType<{ className?: string }>;
  actions?: InfoPageAction[];
  highlights?: InfoPageCard[];
  sections: InfoPageSection[];
}

function InfoAction({ action }: { action: InfoPageAction }) {
  if (action.external) {
    return (
      <a href={action.href} target="_blank" rel="noreferrer" className="info-page__action">
        {action.label}
      </a>
    );
  }

  return (
    <Link href={action.href} className="info-page__action">
      {action.label}
    </Link>
  );
}

export function InfoPage({ eyebrow, title, lead, icon: Icon, actions, highlights, sections }: InfoPageProps) {
  return (
    <article className="info-page">
      <header className="info-page__hero">
        <div className="info-page__hero-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{lead}</p>
          {actions?.length ? (
            <div className="info-page__actions">
              {actions.map((action) => (
                <InfoAction key={action.label} action={action} />
              ))}
            </div>
          ) : null}
        </div>

        <span className="info-page__hero-icon" aria-hidden="true">
          <Icon />
        </span>
      </header>

      {highlights?.length ? (
        <section className="info-page__highlights" aria-label="Ключевая информация">
          {highlights.map((item) => (
            <div className="info-page__highlight" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          ))}
        </section>
      ) : null}

      <div className="info-page__sections">
        {sections.map((section) => (
          <section className="info-section" key={section.title}>
            <div className="info-section__heading">
              <h2>{section.title}</h2>
              {section.text ? <p>{section.text}</p> : null}
            </div>

            {section.cards?.length ? (
              <div className="info-section__cards">
                {section.cards.map((card) => (
                  <article className="info-card" key={card.title}>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </article>
                ))}
              </div>
            ) : null}

            {section.list?.length ? (
              <ul className="info-list">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <section className="info-contact-card" aria-label="Связаться с магазином">
        <div>
          <h2>Остались вопросы?</h2>
          <p>Напишите нам в Telegram или Max, либо позвоните по телефону. Быстрее всего уточнить наличие, маршрут и детали заказа можно в мессенджерах.</p>
        </div>
        <div className="info-contact-card__links">
          <a href={siteConfig.phoneHref}>{siteConfig.phoneLabel}</a>
          <a href={siteConfig.telegramUrl} target="_blank" rel="noreferrer">
            <TelegramBrandIcon />
            Telegram
          </a>
          <a href={siteConfig.maxUrl} target="_blank" rel="noreferrer">
            <MaxBrandIcon />
            Max
          </a>
        </div>
      </section>
    </article>
  );
}
