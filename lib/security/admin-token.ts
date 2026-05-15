import { createHash, timingSafeEqual } from "node:crypto";

function hashToken(value: string) {
  return createHash("sha256").update(value).digest();
}

export function isAdminTokenValid(inputToken: string, configuredToken: string) {
  const input = inputToken.trim();
  const configured = configuredToken.trim();

  if (!input || !configured) {
    return false;
  }

  return timingSafeEqual(hashToken(input), hashToken(configured));
}
