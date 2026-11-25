import type { Metadata } from "next";
import snapshot from "../../../../api/catalog/products.json";
import { AllProducts } from "@/components/all-products";

export const metadata: Metadata = {
  title: "همه محصولات بهنوش | طعم دلخواهت را پیدا کن",
  description:
    "کشف ۱۰۷ محصول بهنوش؛ جست‌وجو بر اساس طعم، دسته‌بندی، برند و بسته‌بندی، همراه با خرید نمایشی.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : "";
  const entries = snapshot.products.map((product) => ({
    sourceId: product.source_id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    flavor: product.flavor,
    packaging: product.pack,
    volume: product.volume_ml,
  }));
  const initialFilters = {
    query: value("q"),
    category: value("category"),
    brand: value("brand"),
    packaging: value("packaging"),
    available: false,
    sort: "catalog",
  };
  return (
    <AllProducts
      key={JSON.stringify(initialFilters)}
      entries={entries}
      initialFilters={initialFilters}
    />
  );
}
