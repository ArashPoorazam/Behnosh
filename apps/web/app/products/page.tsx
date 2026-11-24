import type { Metadata } from "next";
import snapshot from "../../../../api/catalog/products.json";
import { AllProducts } from "@/components/all-products";

export const metadata: Metadata = {
  title: "همه محصولات بهنوش | طعم دلخواهت را پیدا کن",
  description:
    "کشف ۱۰۷ محصول بهنوش؛ جست‌وجو بر اساس طعم، دسته‌بندی، برند و بسته‌بندی، همراه با خرید نمایشی.",
};

export default function ProductsPage() {
  const entries = snapshot.products.map((product) => ({
    sourceId: product.source_id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    flavor: product.flavor,
    packaging: product.pack,
    volume: product.volume_ml,
  }));
  return <AllProducts entries={entries} />;
}
