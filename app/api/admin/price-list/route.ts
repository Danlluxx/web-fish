import { NextResponse } from "next/server";

import { getAdminImportToken, importPriceListFromBuffer } from "@/lib/catalog/import-price-list";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const configuredToken = getAdminImportToken();

  if (!configuredToken) {
    return NextResponse.json(
      { error: "На сервере не настроен ADMIN_PRICE_IMPORT_TOKEN." },
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
    return NextResponse.json({ error: "Excel-файл не найден в запросе." }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json({ error: "Поддерживается только формат .xlsx." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = await importPriceListFromBuffer(file.name, buffer);

    return NextResponse.json({
      ok: true,
      productCount: meta.productCount,
      sourceFileName: meta.sourceFileName,
      importedAt: meta.importedAt,
      newArrivalCount: meta.newArrivalCount ?? 0
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка импорта.";

    return NextResponse.json(
      { error: `Не удалось импортировать прайс: ${message}` },
      { status: 500 }
    );
  }
}
