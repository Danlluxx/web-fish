import { NextResponse } from "next/server";

import { getCatalogResult } from "@/lib/catalog/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;
  const categorySlug = searchParams.get("category") ?? undefined;
  const subcategorySlug = searchParams.get("subcategory") ?? undefined;
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = Number.parseInt(searchParams.get("pageSize") ?? "18", 10);

  const result = await getCatalogResult({
    query,
    categorySlug,
    subcategorySlug,
    page: Number.isNaN(page) ? 1 : page,
    pageSize: Number.isNaN(pageSize) ? 18 : pageSize
  });

  return NextResponse.json(result);
}
