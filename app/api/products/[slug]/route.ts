import { NextResponse } from "next/server";

import { getProductBySlug } from "@/lib/catalog/service";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { slug } = await context.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}
