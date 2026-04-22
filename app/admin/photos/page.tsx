import { PhotoImportForm } from "@/components/admin/photo-import-form";
import { getPhotoImportDashboard } from "@/lib/catalog/import-product-photos";

export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  const dashboard = await getPhotoImportDashboard();

  return <PhotoImportForm {...dashboard} />;
}
