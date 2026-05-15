import { NextResponse } from "next/server";

import {
  getAdminNewArrivalsImportToken,
  importNewArrivalsFromBuffer
} from "@/lib/catalog/new-arrivals";
import { isAdminTokenValid } from "@/lib/security/admin-token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const configuredToken = getAdminNewArrivalsImportToken();

  if (!configuredToken) {
    return NextResponse.json(
      { error: "На сервере не настроен ADMIN_NEW_ARRIVALS_IMPORT_TOKEN или ADMIN_PRICE_IMPORT_TOKEN." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const token = String(formData.get("token") ?? "").trim();
  const file = formData.get("file");

  if (!isAdminTokenValid(token, configuredToken)) {
    return NextResponse.json({ error: "Неверный токен администратора." }, { status: 401 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Excel-файл не найден в запросе." }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json({ error: "Поддерживается только формат .xlsx." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const state = await importNewArrivalsFromBuffer(file.name, buffer);

    return NextResponse.json({
      ok: true,
      sourceFileName: state.sourceFileName,
      importedAt: state.importedAt,
      sourceProductCount: state.sourceProductCount,
      matchedCount: state.matchedCount,
      missingCount: state.missingCount
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка импорта.";

    return NextResponse.json(
      { error: `Не удалось импортировать новые поступления: ${message}` },
      { status: 500 }
    );
  }
}
