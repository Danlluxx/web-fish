import { PriceImportForm } from "@/components/admin/price-import-form";
import { getRuntimeCatalogMeta } from "@/lib/catalog/data-source";

export const dynamic = "force-dynamic";

export default async function AdminPriceListPage() {
  const meta = await getRuntimeCatalogMeta();

  return (
    <PriceImportForm
      currentSourceFileName={meta.sourceFileName}
      importedAt={meta.importedAt}
      productCount={meta.productCount}
      newArrivalCount={meta.newArrivalCount ?? 0}
    />
  );
}
