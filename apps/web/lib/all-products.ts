import type { Product } from "./api";
import { catalogDisplay } from "./catalog-display";

export type CatalogEntry = {
  sourceId: string;
  name: string;
  brand: string;
  category: string;
  flavor: string;
  packaging: string;
  volume: number;
};
export type CatalogItem = CatalogEntry & { offer?: Product };
export type CatalogFilters = {
  query: string;
  category: string;
  brand: string;
  packaging: string;
  available: boolean;
  sort: string;
};
export const emptyFilters: CatalogFilters = {
  query: "",
  category: "",
  brand: "",
  packaging: "",
  available: false,
  sort: "catalog",
};
export const categoryLabels: Record<string, string> = {
  "نوشیدنی مالت بدون الکل": "مالت بدون الکل",
  "نوشیدنی مالت بدون الکل (پریمیکس)": "مالت پریمیکس",
  "نوشیدنی و نوشابه گازدار میوه‌ای": "نوشیدنی‌های دادلی",
  "نوشیدنی میوه‌ای گازدار": "میوه‌ای گازدار",
  "نوشیدنی میوه‌ای بدون گاز": "میوه‌ای بدون گاز",
  "نوشابه انرژی‌زا": "انرژی‌زا",
};

// Normalize Arabic keyboard variants, spacing, diacritics and all three digit sets.
export function normalizeSearch(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[\s\u200c\u200d-]+/g, "")
    .trim();
}
export function joinCatalog(
  entries: CatalogEntry[],
  offers: Product[],
): CatalogItem[] {
  const bySource = new Map(
    offers.map((offer) => [
      catalogDisplay[offer.asset]?.sourceId ??
        offer.asset.replace(/^catalog-/, ""),
      offer,
    ]),
  );
  return entries.map((entry) => ({
    ...entry,
    offer: bySource.get(entry.sourceId),
  }));
}
export function available(item: CatalogItem) {
  return item.offer?.variants.some((v) => v.active && v.available > 0) ?? false;
}
export function startingPrice(item: CatalogItem) {
  const prices =
    item.offer?.variants.filter((v) => v.active).map((v) => v.price_rial) ?? [];
  return prices.length ? Math.min(...prices) : Infinity;
}
export function filterCatalog(items: CatalogItem[], filters: CatalogFilters) {
  const words = filters.query
    .trim()
    .split(/\s+/)
    .map(normalizeSearch)
    .filter(Boolean);
  const results = items.filter((item) => {
    const haystack = normalizeSearch(
      `${item.name} ${item.brand} ${item.flavor} ${item.category} ${item.packaging} ${item.volume} میلی لیتر`,
    );
    return (
      words.every((word) => haystack.includes(word)) &&
      (!filters.category || item.category === filters.category) &&
      (!filters.brand || item.brand === filters.brand) &&
      (!filters.packaging || item.packaging === filters.packaging) &&
      (!filters.available || available(item))
    );
  });
  if (filters.sort === "name")
    results.sort((a, b) => a.name.localeCompare(b.name, "fa"));
  if (filters.sort === "price-up" || filters.sort === "price-down") {
    const direction = filters.sort === "price-up" ? 1 : -1;
    results.sort((a, b) => {
      const ap = startingPrice(a),
        bp = startingPrice(b);
      if (!Number.isFinite(ap)) return Number.isFinite(bp) ? 1 : 0;
      if (!Number.isFinite(bp)) return -1;
      return (ap - bp) * direction;
    });
  }
  return results;
}
export function flavorColor(item: CatalogEntry) {
  if (/هلو|انار|توت|آلبالو/.test(item.flavor)) return "#f4dedc";
  if (/پرتقال|انبه/.test(item.flavor)) return "#f8dfbf";
  if (/لیمو|آناناس/.test(item.flavor)) return "#f0edbe";
  if (/بلک|کلاسیک|قهوه/.test(item.flavor)) return "#e6dfd1";
  if (/آب آشامیدنی|دوغ/.test(item.category) || /بلو/.test(item.flavor))
    return "#dcebf0";
  return "#e0ead5";
}
