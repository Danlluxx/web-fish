import { access, readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const STORAGE_MEDIA_ROOT = path.join(process.cwd(), "storage", "product-images");
const FALLBACK_MEDIA_ROOT = path.join(process.cwd(), "public", "images", "products");
const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

interface RouteContext {
  params: Promise<{ segments: string[] }>;
}

function isSafeSegment(segment: string): boolean {
  return Boolean(segment) && segment !== "." && segment !== ".." && !segment.includes("/");
}

async function resolveMediaPath(segments: string[]): Promise<string | null> {
  const storagePath = path.join(STORAGE_MEDIA_ROOT, ...segments);

  try {
    await access(storagePath);
    return storagePath;
  } catch {
    const fallbackPath = path.join(FALLBACK_MEDIA_ROOT, ...segments);

    try {
      await access(fallbackPath);
      return fallbackPath;
    } catch {
      return null;
    }
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { segments } = await context.params;

  if (!segments.length || !segments.every(isSafeSegment)) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = await resolveMediaPath(segments);

  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[extension] ?? "application/octet-stream";
  const file = await readFile(filePath);

  return new Response(file, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=86400"
    }
  });
}

