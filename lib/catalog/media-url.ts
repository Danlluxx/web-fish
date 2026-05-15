const PRODUCT_MEDIA_BASE_URL_ENV = "PRODUCT_MEDIA_PUBLIC_BASE_URL";

function normalizeBaseUrl(value: string | undefined): string {
  return (value ?? "").trim().replace(/\/+$/g, "");
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function extractArticleMediaPath(source: string): string | null {
  const normalizedSource = source.trim();
  const knownPrefixes = [
    "/api/product-media/articles/",
    "/images/products/articles/"
  ];
  const matchedPrefix = knownPrefixes.find((prefix) => normalizedSource.startsWith(prefix));

  if (!matchedPrefix) {
    return null;
  }

  return normalizedSource.slice(matchedPrefix.length).replace(/^\/+/g, "");
}

export function getConfiguredProductMediaBaseUrl(): string {
  return normalizeBaseUrl(process.env[PRODUCT_MEDIA_BASE_URL_ENV]);
}

export function resolveProductMediaUrl(source: string): string {
  const cleanedSource = source.trim();
  const productMediaBaseUrl = getConfiguredProductMediaBaseUrl();
  const articleMediaPath = productMediaBaseUrl ? extractArticleMediaPath(cleanedSource) : null;

  if (productMediaBaseUrl && articleMediaPath) {
    return `${productMediaBaseUrl}/${articleMediaPath}`;
  }

  return cleanedSource;
}

export function isSafeProductMediaUrl(source: string): boolean {
  const cleanedSource = source.trim();

  if (!cleanedSource || /[\u0000-\u001F\u007F]/.test(cleanedSource)) {
    return false;
  }

  if (cleanedSource.startsWith("/")) {
    return !cleanedSource.startsWith("//");
  }

  return isHttpUrl(cleanedSource);
}
