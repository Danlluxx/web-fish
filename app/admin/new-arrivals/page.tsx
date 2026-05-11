import { NewArrivalsImportForm } from "@/components/admin/new-arrivals-import-form";
import { getNewArrivalsState } from "@/lib/catalog/new-arrivals";

export const dynamic = "force-dynamic";

export default async function AdminNewArrivalsPage() {
  const state = await getNewArrivalsState();

  return <NewArrivalsImportForm state={state} />;
}
