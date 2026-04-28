import { randomUUID } from "node:crypto";

import { getAllProducts } from "@/lib/catalog/service";
import {
  buildOrderFingerprint,
  consumeOrderAttempt,
  getClientIp,
  hasRecentDuplicateOrder,
  rememberSubmittedOrder
} from "@/lib/orders/anti-abuse";
import { deliverOrderEmail } from "@/lib/orders/email";
import { appendOrder } from "@/lib/orders/store";
import type { CheckoutCustomer, CheckoutRequestItem, StoredOrder, StoredOrderItem } from "@/types/order";

export const runtime = "nodejs";

interface OrderRequestPayload {
  customer?: CheckoutCustomer;
  items?: CheckoutRequestItem[];
}

function withRetryAfterHeaders(retryAfterSeconds: number) {
  return {
    headers: {
      "Retry-After": String(retryAfterSeconds)
    }
  };
}

function normalizeText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function validateCustomer(customer?: CheckoutCustomer): CheckoutCustomer | null {
  if (!customer) {
    return null;
  }

  const fullName = normalizeText(customer.fullName);
  const phone = normalizeText(customer.phone);
  const deliveryAddress = normalizeText(customer.deliveryAddress);

  if (!fullName || !phone || !deliveryAddress) {
    return null;
  }

  return {
    fullName,
    phone,
    deliveryAddress
  };
}

function validateItems(items?: CheckoutRequestItem[]): CheckoutRequestItem[] | null {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const normalizedItems = items
    .map((item) => {
      const slug = normalizeText(item?.slug);
      const quantity = Number(item?.quantity ?? 0);

      if (!slug || !Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }

      return {
        slug,
        quantity: Math.max(1, Math.floor(quantity))
      };
    })
    .filter((item): item is CheckoutRequestItem => Boolean(item));

  return normalizedItems.length > 0 ? normalizedItems : null;
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimitDecision = consumeOrderAttempt(clientIp);

  if (!rateLimitDecision.ok) {
    const message =
      rateLimitDecision.reason === "cooldown"
        ? "Слишком частая отправка. Подождите немного и попробуйте снова."
        : "Слишком много попыток оформления заказа. Повторите немного позже.";

    return Response.json(
      { error: message },
      {
        status: 429,
        ...withRetryAfterHeaders(rateLimitDecision.retryAfterSeconds)
      }
    );
  }

  let payload: OrderRequestPayload;

  try {
    payload = (await request.json()) as OrderRequestPayload;
  } catch {
    return Response.json({ error: "Некорректный формат запроса." }, { status: 400 });
  }

  const customer = validateCustomer(payload.customer);
  const items = validateItems(payload.items);

  if (!customer || !items) {
    return Response.json(
      { error: "Проверьте данные покупателя и состав корзины." },
      { status: 400 }
    );
  }

  const orderFingerprint = buildOrderFingerprint(customer, items);

  if (hasRecentDuplicateOrder(orderFingerprint)) {
    return Response.json(
      {
        error: "Похожий заказ уже был недавно отправлен. Если нужно оформить его снова, подождите пару минут."
      },
      { status: 409 }
    );
  }

  const products = await getAllProducts();
  const productMap = new Map(products.map((product) => [product.slug, product]));

  const storedItems = items
    .map((item): StoredOrderItem | null => {
      const product = productMap.get(item.slug);

      if (!product) {
        return null;
      }

      return {
        slug: product.slug,
        title: product.title,
        price: product.price,
        category: product.category,
        subcategory: product.subcategory,
        quantity: item.quantity
      };
    })
    .filter((item): item is StoredOrderItem => Boolean(item));

  if (storedItems.length !== items.length) {
    return Response.json(
      { error: "Некоторые товары в корзине больше недоступны. Обновите страницу." },
      { status: 400 }
    );
  }

  const orderBase = {
    id: `AQ-${randomUUID().slice(0, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    customer,
    items: storedItems,
    totalQuantity: storedItems.reduce((total, item) => total + item.quantity, 0),
    status: "new" as const
  };

  const emailResult = await deliverOrderEmail({
    ...orderBase,
    emailDeliveryStatus: "skipped"
  });

  const order: StoredOrder = {
    ...orderBase,
    emailDeliveryStatus: emailResult.status,
    emailDeliveryMessage: emailResult.message
  };

  await appendOrder(order);
  rememberSubmittedOrder(orderFingerprint);

  return Response.json({
    ok: true,
    orderId: order.id,
    emailStatus: order.emailDeliveryStatus,
    emailMessage: order.emailDeliveryMessage
  });
}
