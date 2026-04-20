import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getRuntimeCatalogMeta } from "@/lib/catalog/data-source";
import { getCurrentPriceStoragePath } from "@/lib/catalog/import-price-list";

export const runtime = "nodejs";

const FALLBACK_PRICE_PATH = path.join(process.cwd(), "public", "files", "current-price.xlsx");

async function resolvePricePath() {
  const storagePath = getCurrentPriceStoragePath();

  try {
    await access(storagePath);
    return storagePath;
  } catch {
    return FALLBACK_PRICE_PATH;
  }
}

function buildDownloadName(sourceFileName: string | undefined) {
  const name = (sourceFileName ?? "current-price.xlsx").trim();
  return name.toLowerCase().endsWith(".xlsx") ? name : `${name}.xlsx`;
}

export async function GET() {
  try {
    const [filePath, meta] = await Promise.all([resolvePricePath(), getRuntimeCatalogMeta()]);
    const file = await readFile(filePath);
    const downloadName = buildDownloadName(meta.sourceFileName);

    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Текущий прайс-лист пока недоступен." }, { status: 404 });
  }
}
