import { HomePage } from "@/components/home/home-page";
import { getCatalogResult, getSections } from "@/lib/catalog/service";

export default async function Home() {
  const sections = getSections();
  const initialCatalog = await getCatalogResult({ page: 1, pageSize: 8 });
  const totalSubcategories = sections.reduce(
    (count, section) => count + section.subcategories.length,
    0
  );

  return (
    <HomePage
      sections={sections}
      featuredProducts={initialCatalog.items}
      totalProducts={initialCatalog.total}
      totalSubcategories={totalSubcategories}
    />
  );
}
