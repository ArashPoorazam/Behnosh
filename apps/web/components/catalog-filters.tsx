"use client";
import { Asterisk, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import {
  categoryLabels,
  type CatalogEntry,
  type CatalogFilters,
} from "@/lib/all-products";
import { number } from "@/lib/money";

export function CatalogFiltersPanel({
  entries,
  filters,
  expanded,
  onToggle,
  onChange,
  onReset,
}: {
  entries: CatalogEntry[];
  filters: CatalogFilters;
  expanded: boolean;
  onToggle: () => void;
  onChange: (next: Partial<CatalogFilters>) => void;
  onReset: () => void;
}) {
  const categories = [...new Set(entries.map((item) => item.category))];
  const brands = [...new Set(entries.map((item) => item.brand))];
  const packs = [...new Set(entries.map((item) => item.packaging))];
  const activeCount = [
    filters.category,
    filters.brand,
    filters.packaging,
    filters.available,
  ].filter(Boolean).length;
  return (
    <aside
      className={`shelf-filters ${expanded ? "is-expanded" : ""}`}
      aria-label="فیلتر محصولات"
    >
      <button
        className="shelf-mobile-filter"
        aria-expanded={expanded}
        aria-controls="catalog-filter-content"
        onClick={onToggle}
      >
        <SlidersHorizontal size={18} /> دسته‌بندی و فیلتر{" "}
        {activeCount > 0 && <b>{number(activeCount)}</b>}
        <ChevronDown size={18} />
      </button>
      <div id="catalog-filter-content" className="shelf-filter-content">
        <div className="shelf-filter-selects">
          <label htmlFor="filter-category">دسته‌بندی‌ها</label>
          <div className="shelf-select">
            <select
              id="filter-category"
              value={filters.category}
              onChange={(e) => onChange({ category: e.target.value })}
            >
              <option value="">
                همه نوشیدنی‌ها ({number(entries.length)})
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category] ?? category} (
                  {number(
                    entries.filter((item) => item.category === category).length,
                  )}
                  )
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>
          <label htmlFor="filter-brand">برند دلخواهت</label>
          <div className="shelf-select">
            <select
              id="filter-brand"
              value={filters.brand}
              onChange={(e) => onChange({ brand: e.target.value })}
            >
              <option value="">همه برندها</option>
              {brands.map((brand) => (
                <option key={brand}>{brand}</option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>
          <label htmlFor="filter-pack">نوع بسته‌بندی</label>
          <div className="shelf-select">
            <select
              id="filter-pack"
              value={filters.packaging}
              onChange={(e) => onChange({ packaging: e.target.value })}
            >
              <option value="">همه بسته‌بندی‌ها</option>
              {packs.map((pack) => (
                <option key={pack}>{pack}</option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>
          <label className="shelf-stock-filter">
            <input
              type="checkbox"
              checked={filters.available}
              onChange={(e) => onChange({ available: e.target.checked })}
            />
            فقط موجودها
          </label>
          {activeCount > 0 && (
            <button className="shelf-reset" onClick={onReset}>
              <X size={15} />
              پاک کردن فیلترها
            </button>
          )}
        </div>
        <div className="shelf-sidebar-note">
          <span aria-hidden="true">
            <Asterisk size={36} />
          </span>
          <p>
            از یک جرعه شروع می‌شه.
            <br />
            <strong>طعمِ لحظه‌ات رو پیدا کن.</strong>
          </p>
        </div>
      </div>
    </aside>
  );
}
