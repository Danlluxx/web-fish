import { NextResponse } from "next/server";

import {
  getAdminPhotoImportToken,
  importProductMediaManifestFromBuffer,
  importProductPhotosFromBuffer,
  retryProductPhotosImport
} from "@/lib/catalog/import-product-photos";
import { isAdminTokenValid } from "@/lib/security/admin-token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const configuredToken = getAdminPhotoImportToken();

  if (!configuredToken) {
    return NextResponse.json(
      { error: "На сервере не настроен ADMIN_PHOTO_IMPORT_TOKEN или ADMIN_PRICE_IMPORT_TOKEN." },
      { status: 500 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const payload = (await request.json()) as {
        token?: string;
        storedArchiveName?: string;
      };
      const token = String(payload.token ?? "").trim();

      if (!isAdminTokenValid(token, configuredToken)) {
        return NextResponse.json({ error: "Неверный токен администратора." }, { status: 401 });
      }

      const storedArchiveName = String(payload.storedArchiveName ?? "").trim();

      if (!storedArchiveName) {
        return NextResponse.json(
          { error: "Не удалось определить архив для повторного импорта." },
          { status: 400 }
        );
      }

      const meta = await retryProductPhotosImport(storedArchiveName);

      return NextResponse.json({
        ok: true,
        sourceFileName: meta.sourceFileName,
        storedArchiveName: meta.storedArchiveName,
        importedAt: meta.importedAt,
        articleCount: meta.articleCount,
        photoCount: meta.photoCount
      });
    }

    const formData = await request.formData();
    const token = String(formData.get("token") ?? "").trim();
    const file = formData.get("file");

    if (!isAdminTokenValid(token, configuredToken)) {
      return NextResponse.json({ error: "Неверный токен администратора." }, { status: 401 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Архив с фотографиями не найден в запросе." },
        { status: 400 }
      );
    }

    const lowerFileName = file.name.toLowerCase();

    if (!lowerFileName.endsWith(".zip") && !lowerFileName.endsWith(".json")) {
      return NextResponse.json(
        { error: "Поддерживается архив .zip или JSON-манифест медиатеки." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = lowerFileName.endsWith(".json")
      ? await importProductMediaManifestFromBuffer(file.name, buffer)
      : await importProductPhotosFromBuffer(file.name, buffer);

    return NextResponse.json({
      ok: true,
      sourceFileName: meta.sourceFileName,
      storedArchiveName: meta.storedArchiveName,
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
