import { siteConfig } from "@/lib/site";
import { sendSmtpMail, type SmtpClientConfig } from "@/lib/email/smtp";
import { buildOrderSpreadsheet } from "@/lib/orders/excel";
import type { OrderEmailDeliveryStatus, StoredOrder } from "@/types/order";

interface OrderEmailResult {
  status: OrderEmailDeliveryStatus;
  message?: string;
}

function normalizeEnv(value: string | undefined): string {
  return value?.trim() ?? "";
}

function getOrderEmailConfig(): (SmtpClientConfig & { from: string; recipients: string[] }) | null {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const portValue = normalizeEnv(process.env.SMTP_PORT);
  const secureValue = normalizeEnv(process.env.SMTP_SECURE).toLowerCase();
  const user = normalizeEnv(process.env.SMTP_USER);
  const pass = normalizeEnv(process.env.SMTP_PASS);
  const fromEmail = normalizeEnv(process.env.SMTP_FROM_EMAIL);
  const fromName = normalizeEnv(process.env.SMTP_FROM_NAME) || siteConfig.name;
  const recipients = normalizeEnv(process.env.ORDER_RECEIVER_EMAIL)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!host || !fromEmail || recipients.length === 0) {
    return null;
  }

  const port = Number(portValue || (secureValue === "true" ? 465 : 587));
  const secure = secureValue === "true";
  const useStartTls = normalizeEnv(process.env.SMTP_DISABLE_STARTTLS).toLowerCase() !== "true";
  const ehloHostname = normalizeEnv(process.env.SMTP_EHLO_HOSTNAME) || "localhost";

  return {
    host,
    port,
    secure,
    user: user || undefined,
    pass: pass || undefined,
    ehloHostname,
    useStartTls,
    from: `${fromName} <${fromEmail}>`,
    recipients
  };
}

function buildOrderEmailText(order: StoredOrder): string {
  const formattedDate = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow"
  }).format(new Date(order.createdAt));

  return [
    `Новый заказ ${order.id}`,
    "",
    `Дата: ${formattedDate} МСК`,
    `ФИО: ${order.customer.fullName}`,
    `Телефон: ${order.customer.phone}`,
    `Адрес доставки: ${order.customer.deliveryAddress}`,
    `Всего единиц: ${order.totalQuantity}`
  ].join("\n");
}


export async function deliverOrderEmail(order: StoredOrder): Promise<OrderEmailResult> {
  const config = getOrderEmailConfig();

  if (!config) {
    return {
      status: "skipped",
      message: "SMTP не настроен: заказ сохранён, но письмо с Excel-файлом не отправлено."
    };
  }

  try {
    const attachment = buildOrderSpreadsheet(order);

    await sendSmtpMail(config, {
      from: config.from,
      to: config.recipients,
      subject: `Новый заказ ${order.id} — ${order.customer.fullName}`,
      text: buildOrderEmailText(order),
      attachments: [attachment]
    });

    return {
      status: "sent",
      message: "Ваш заказ передан менеджеру."
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка отправки письма.";

    return {
      status: "failed",
      message: `Заказ сохранён, но отправка письма не удалась: ${message}`
    };
  }
}
