"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Asterisk, ChevronDown, Search, ShoppingBag, X } from "lucide-react";
import { useCommerce } from "@/lib/use-commerce";
import { number } from "@/lib/money";
import {
  categoryLabels,
  emptyFilters,
  filterCatalog,
  joinCatalog,
  type CatalogEntry,
  type CatalogFilters,
} from "@/lib/all-products";
import { BrandMark } from "./brand-shell";
import { CartDrawer } from "./cart-drawer";
import { CatalogCard } from "./catalog-card";
import { CatalogFiltersPanel } from "./catalog-filters";

const PAGE_SIZE = 24;

export function AllProducts({
  entries,
  initialFilters = emptyFilters,
}: {
  entries: CatalogEntry[];
  initialFilters?: CatalogFilters;
}) {
  const commerce = useCommerce();
  const [cartOpen, setCartOpen] = useState(false);
  const [filters, setFilters] = useState<CatalogFilters>(initialFilters);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const search = useRef<HTMLInputElement>(null);
  const adding = useRef(false);
  const cartOpener = useRef<HTMLElement | null>(null);
  const items = useMemo(
    () => joinCatalog(entries, commerce.products),
    [entries, commerce.products],
  );
  const results = useMemo(
    () => filterCatalog(items, filters),
    [items, filters],
  );
  const cartCount = commerce.cart.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const update = (next: Partial<CatalogFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setVisible(PAGE_SIZE);
  };
  const reset = () => {
    setFilters(emptyFilters);
    setVisible(PAGE_SIZE);
  };
  const add = async (id: string) => {
    if (adding.current) return;
    cartOpener.current = document.activeElement as HTMLElement;
    adding.current = true;
    try {
      const current =
        commerce.cart.items.find((item) => item.variant_id === id)?.quantity ??
        0;
      if (await commerce.setQuantity(id, current + 1)) setCartOpen(true);
    } finally {
      adding.current = false;
    }
  };
  const activeFilters = [
    {
      key: "category",
      label: categoryLabels[filters.category] ?? filters.category,
    },
    { key: "brand", label: filters.brand },
    { key: "packaging", label: filters.packaging },
    { key: "available", label: filters.available ? "فقط موجودها" : "" },
  ] as const;
  return (
    <div className="all-products-page">
      <header className="shelf-header">
        <Link
          href="/"
          className="shelf-home"
          dir="ltr"
          aria-label="بهنوش، خانه"
        >
          <BrandMark />
        </Link>
        <nav aria-label="ناوبری اصلی">
          <Link href="/">خانه بهنوش</Link>
          <Link href="/products" aria-current="page">
            همه محصولات
          </Link>
          <Link href="/orders">سفارش‌های من</Link>
        </nav>
        <button
          className="showcase-cart"
          onClick={(event) => {
            cartOpener.current = event.currentTarget;
            setCartOpen(true);
          }}
          aria-label="باز کردن سبد خرید"
        >
          <ShoppingBag size={19} />
          <span>سبد خرید</span>
          <b>{number(cartCount)}</b>
        </button>
      </header>
      <main id="main">
        <section className="shelf-hero" aria-labelledby="catalog-title">
          <div className="shelf-hero-copy">
            <p className="shelf-eyebrow">
              دنیای نوشیدنی‌های بهنوش <span /> همه محصولات
            </p>
            <h1 id="catalog-title">
              نوشیدنی‌های بهنوش
              <br />
              <span>انتخاب شما</span>
            </h1>
            <p className="shelf-hero-description">
              مالت، نوشیدنی‌های میوه‌ای و انرژی‌زا.
              <br />
              محصولات را بر اساس طعم، برند و بسته‌بندی بررسی کنید.
            </p>
            <div className="shelf-hero-meta">
              <strong>{number(entries.length)}</strong> انتخاب <span />{" "}
              <strong>
                {number(new Set(entries.map((p) => p.brand)).size)}
              </strong>{" "}
              برند
            </div>
          </div>
          <div className="shelf-hero-art" aria-hidden="true">
            <img
              className="shelf-hero-bottle"
              src="/assets/catalog/152-v1.webp"
              alt=""
              width={480}
              height={600}
            />
            <img
              className="shelf-hero-can"
              src="/assets/catalog/182-v1.webp"
              alt=""
              width={480}
              height={600}
            />
            <img
              className="shelf-hero-lemon"
              src="/assets/catalog/136-v1.webp"
              alt=""
              width={480}
              height={600}
            />
          </div>
        </section>
        <div className="shelf-search-bar">
          <div className="shelf-search-field">
            <Search size={23} />
            <label htmlFor="catalog-search" className="sr-only">
              جست‌وجوی محصولات
            </label>
            <input
              ref={search}
              id="catalog-search"
              type="search"
              placeholder="دنبال چه طعمی می‌گردی؟ نام، طعم یا برند…"
              value={filters.query}
              onChange={(e) => update({ query: e.target.value })}
            />
            {filters.query && (
              <button
                className="icon-button"
                aria-label="پاک کردن جست‌وجو"
                onClick={() => {
                  update({ query: "" });
                  search.current?.focus();
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
          <p>
            <span aria-hidden="true">
              <Asterisk />
            </span>{" "}
            برای هر حال، یک انتخاب
          </p>
        </div>
        <div className="shelf-layout">
          <CatalogFiltersPanel
            entries={entries}
            filters={filters}
            expanded={filtersExpanded}
            onToggle={() => setFiltersExpanded((value) => !value)}
            onChange={update}
            onReset={reset}
          />
          <section className="shelf-results" aria-labelledby="results-heading">
            <div className="shelf-results-toolbar">
              <div>
                <h2 id="results-heading">
                  {filters.category
                    ? (categoryLabels[filters.category] ?? filters.category)
                    : "همه نوشیدنی‌ها"}
                </h2>
                <p role="status" aria-live="polite">
                  {number(results.length)} محصول
                  {filters.query
                    ? ` برای «${filters.query}»`
                    : " برای کشف کردن"}
                </p>
              </div>
              <div className="shelf-select shelf-sort">
                <label className="sr-only" htmlFor="catalog-sort">
                  مرتب‌سازی
                </label>
                <select
                  id="catalog-sort"
                  value={filters.sort}
                  onChange={(e) => update({ sort: e.target.value })}
                >
                  <option value="catalog">چیدمان کاتالوگ</option>
                  <option value="price-up">قیمت: کم به زیاد</option>
                  <option value="price-down">قیمت: زیاد به کم</option>
                  <option value="name">نام محصول</option>
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            {activeFilters.some((filter) => filter.label) && (
              <div className="shelf-active-filters">
                {activeFilters
                  .filter((filter) => filter.label)
                  .map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() =>
                        update({
                          [filter.key]: filter.key === "available" ? false : "",
                        })
                      }
                      aria-label={`حذف فیلتر ${filter.label}`}
                    >
                      {filter.label}
                      <X size={14} />
                    </button>
                  ))}
              </div>
            )}
            <p className="shelf-demo-note">
              این فروشگاه نمایشی است؛ قیمت‌ها، موجودی و پرداخت واقعی نیستند.
            </p>
            {commerce.error && (
              <div role="alert" className="shelf-error">
                {commerce.error}
                <button onClick={() => void commerce.reload()}>
                  تلاش دوباره
                </button>
              </div>
            )}
            {results.length ? (
              <>
                <div className="shelf-grid" aria-busy={commerce.loading}>
                  {results.slice(0, visible).map((item) => (
                    <CatalogCard
                      key={item.sourceId}
                      item={item}
                      cart={commerce.cart}
                      busy={commerce.busy}
                      loading={commerce.loading}
                      onAdd={add}
                    />
                  ))}
                </div>
                <div className="shelf-load-more">
                  <p>
                    {number(Math.min(visible, results.length))} از{" "}
                    {number(results.length)} محصول
                  </p>
                  <div className="shelf-progress" aria-hidden="true">
                    <span
                      style={{
                        width: `${Math.min(visible / results.length, 1) * 100}%`,
                      }}
                    />
                  </div>
                  {visible < results.length && (
                    <button
                      className="button dark"
                      onClick={() => setVisible((count) => count + PAGE_SIZE)}
                    >
                      دیدن طعم‌های بیشتر <ChevronDown size={18} />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="shelf-no-results">
                <Search size={40} />
                <h3>این طعم را پیدا نکردیم.</h3>
                <p>یک نام دیگر امتحان کن یا فیلترها را کمتر کن.</p>
                <button
                  className="button dark"
                  onClick={() => {
                    reset();
                    search.current?.focus();
                  }}
                >
                  نمایش همه محصولات
                </button>
              </div>
            )}
          </section>
        </div>
        <section className="shelf-signoff">
          <span aria-hidden="true">
            <Asterisk />
          </span>
          <p>
            طعم‌ها فرق می‌کنند
            <br />
            <strong>حالِ خوب، مشترک است</strong>
          </p>
          <Link href="/">گشتی در دنیای بهنوش</Link>
        </section>
      </main>
      <footer className="shelf-footer">
        <Link href="/" className="shelf-home" aria-label="بهنوش، خانه">
          <BrandMark />
        </Link>
        <p>یک جرعه، یک حال‌وهوای تازه</p>
        <Link href="/orders">پیگیری سفارش‌ها</Link>
      </footer>
      <CartDrawer
        opener={cartOpener}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={commerce.cart}
        busy={commerce.busy}
        error={commerce.error}
        onQuantity={commerce.setQuantity}
        onCheckedOut={() => void commerce.reload()}
      />
    </div>
  );
}
