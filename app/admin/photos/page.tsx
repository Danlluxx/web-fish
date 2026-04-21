import { PhotoImportForm } from "@/components/admin/photo-import-form";
import { getRuntimeProductMediaMeta } from "@/lib/catalog/media-data";

export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  const meta = await getRuntimeProductMediaMeta();

  return (
    <PhotoImportForm
      currentSourceFileName={meta.sourceFileName}
      importedAt={meta.importedAt}
      articleCount={meta.articleCount}
      photoCount={meta.photoCount}
    />
  );
}

