import "server-only";

import { createHash } from "node:crypto";

import type { CheckoutCustomer, CheckoutRequestItem } from "@/types/order";

const ORDER_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const ORDER_RATE_LIMIT_MAX_ATTEMPTS = 6;
const ORDER_ATTEMPT_COOLDOWN_MS = 15 * 1000;
const ORDER_DUPLICATE_WINDOW_MS = 3 * 60 * 1000;

interface OrderAttemptStore {
  attemptsByIp: Map<string, number[]>;
  duplicateFingerprints: Map<string, number>;
}

type GlobalWithOrderAttemptStore = typeof globalThis & {
  __aquamarketOrderAttemptStore__?: OrderAttemptStore;
};

interface RateLimitFailure {
  ok: false;
  retryAfterSeconds: number;
  reason: "cooldown" | "window";
}

interface RateLimitSuccess {
  ok: true;
}

export type OrderRateLimitDecision = RateLimitFailure | RateLimitSuccess;

const globalStore = globalThis as GlobalWithOrderAttemptStore;

function getStore(): OrderAttemptStore {
  if (!globalStore.__aquamarketOrderAttemptStore__) {
    globalStore.__aquamarketOrderAttemptStore__ = {
      attemptsByIp: new Map(),
      duplicateFingerprints: new Map()
    };
  }

  return globalStore.__aquamarketOrderAttemptStore__;
}

function normalizeText(value: string | undefined): string {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function getRetryAfterSeconds(milliseconds: number) {
  return Math.max(1, Math.ceil(milliseconds / 1000));
}

function cleanup(now: number) {
  const store = getStore();

  for (const [ip, attempts] of store.attemptsByIp.entries()) {
    const freshAttempts = attempts.filter((timestamp) => now - timestamp <= ORDER_RATE_LIMIT_WINDOW_MS);

    if (freshAttempts.length === 0) {
      store.attemptsByIp.delete(ip);
      continue;
    }

    store.attemptsByIp.set(ip, freshAttempts);
  }

  for (const [fingerprint, timestamp] of store.duplicateFingerprints.entries()) {
    if (now - timestamp > ORDER_DUPLICATE_WINDOW_MS) {
      store.duplicateFingerprints.delete(fingerprint);
    }
  }
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstForwardedIp = forwardedFor
      .split(",")
      .map((part) => part.trim())
      .find(Boolean);

    if (firstForwardedIp) {
      return firstForwardedIp;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();

  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function consumeOrderAttempt(ip: string, now = Date.now()): OrderRateLimitDecision {
  cleanup(now);

  const store = getStore();
  const attempts = store.attemptsByIp.get(ip) ?? [];
  const lastAttempt = attempts.at(-1);

  if (typeof lastAttempt === "number" && now - lastAttempt < ORDER_ATTEMPT_COOLDOWN_MS) {
    return {
      ok: false,
      reason: "cooldown",
      retryAfterSeconds: getRetryAfterSeconds(ORDER_ATTEMPT_COOLDOWN_MS - (now - lastAttempt))
    };
  }

  if (attempts.length >= ORDER_RATE_LIMIT_MAX_ATTEMPTS) {
    return {
      ok: false,
      reason: "window",
      retryAfterSeconds: getRetryAfterSeconds(
        ORDER_RATE_LIMIT_WINDOW_MS - (now - attempts[0])
      )
    };
  }

  attempts.push(now);
  store.attemptsByIp.set(ip, attempts);

  return { ok: true };
}

export function buildOrderFingerprint(customer: CheckoutCustomer, items: CheckoutRequestItem[]) {
  const normalizedPayload = JSON.stringify({
    fullName: normalizeText(customer.fullName).toLowerCase(),
    phone: normalizeText(customer.phone),
    deliveryAddress: normalizeText(customer.deliveryAddress).toLowerCase(),
    items: [...items]
      .map((item) => ({
        slug: normalizeText(item.slug),
        quantity: Math.max(1, Math.floor(item.quantity))
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug))
  });

  return createHash("sha256").update(normalizedPayload).digest("hex");
}

export function hasRecentDuplicateOrder(fingerprint: string, now = Date.now()) {
  cleanup(now);
  const recentTimestamp = getStore().duplicateFingerprints.get(fingerprint);

  return typeof recentTimestamp === "number" && now - recentTimestamp <= ORDER_DUPLICATE_WINDOW_MS;
}

export function rememberSubmittedOrder(fingerprint: string, now = Date.now()) {
  cleanup(now);
  getStore().duplicateFingerprints.set(fingerprint, now);
}
