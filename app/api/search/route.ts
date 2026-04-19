import { NextResponse } from "next/server";

import { getCatalogResult } from "@/lib/catalog/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;

  if (!query) {
    return NextResponse.json({ items: [] });
  }

  const result = await getCatalogResult({ query, page: 1, pageSize: 8 });

  return NextResponse.json({
    items: result.items,
    total: result.total
  });
}
