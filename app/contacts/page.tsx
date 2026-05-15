import type { Metadata } from "next";

import { InfoPage } from "@/components/info/info-page";
import { MailIcon } from "@/components/shared/site-icons";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Контакты магазина Вячеслав о рыбках: телефон, Telegram и Max."
};

export default function ContactsPage() {
  return (
    <InfoPage
      eyebrow="Контакты"
      title="Связаться с магазином"
      lead="Быстрее всего уточнить наличие, детали заказа и доставку можно в Telegram или Max. Также можно позвонить по телефону."
      icon={MailIcon}
      actions={[
        { href: siteConfig.phoneHref, label: siteConfig.phoneLabel },
        { href: siteConfig.telegramUrl, label: "Написать в Telegram", external: true },
        { href: siteConfig.maxUrl, label: "Написать в Max", external: true }
      ]}
      sections={[
        {
          title: "По каким вопросам писать",
          list: [
            "Уточнить наличие и цену товара.",
            "Проверить возможность доставки в ваш город.",
            "Согласовать заказ после отправки заявки с сайта.",
            "Задать вопрос по адаптации рыб после получения."
          ]
        },
        {
          title: "Как быстрее получить ответ",
          text: "Напишите город доставки, интересующие позиции и примерное количество. Если заказ уже оформлен на сайте, укажите номер заявки."
        }
      ]}
    />
  );
}
