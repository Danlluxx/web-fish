import { HomePage } from "@/components/home/home-page";
import { getCatalogResult, getNewArrivalProducts, getSections } from "@/lib/catalog/service";

export default async function Home() {
  const sections = await getSections();
  const initialCatalog = await getCatalogResult({ page: 1, pageSize: 8 });
  const newArrivals = await getNewArrivalProducts(8);
  const totalSubcategories = sections.reduce(
    (count, section) => count + section.subcategories.length,
    0
  );

  return (
    <HomePage
      sections={sections}
      featuredProducts={newArrivals.items}
      hasNewArrivals={newArrivals.items.length > 0}
      totalNewArrivals={newArrivals.total}
      fallbackProductsHref="/catalog"
      totalProducts={initialCatalog.total}
      totalSubcategories={totalSubcategories}
    />
  );
}
