import { NextResponse } from "next/server";

import {
  getAdminPhotoImportToken,
  importProductPhotosFromBuffer
} from "@/lib/catalog/import-product-photos";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const configuredToken = getAdminPhotoImportToken();

  if (!configuredToken) {
    return NextResponse.json(
      { error: "На сервере не настроен ADMIN_PHOTO_IMPORT_TOKEN или ADMIN_PRICE_IMPORT_TOKEN." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const token = String(formData.get("token") ?? "").trim();
  const file = formData.get("file");

  if (token !== configuredToken) {
    return NextResponse.json({ error: "Неверный токен администратора." }, { status: 401 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Архив с фотографиями не найден в запросе." }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".zip")) {
    return NextResponse.json({ error: "Поддерживается только формат .zip." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = await importProductPhotosFromBuffer(file.name, buffer);

    return NextResponse.json({
      ok: true,
      sourceFileName: meta.sourceFileName,
      importedAt: meta.importedAt,
      articleCount: meta.articleCount,
      photoCount: meta.photoCount
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка импорта.";

    return NextResponse.json(
      { error: `Не удалось импортировать фотографии: ${message}` },
      { status: 500 }
    );
  }
}

