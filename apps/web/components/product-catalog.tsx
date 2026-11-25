"use client";
import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/api";
import { number } from "@/lib/money";
import { catalogDisplay, productPoster } from "@/lib/catalog-display";
import { PurchaseControls } from "./purchase-controls";

type Props = {
  products: Product[];
  busy: boolean;
  loading: boolean;
  error: string;
  onAdd: (id: string, quantity: number) => Promise<boolean>;
  onRetry: () => void;
  onCart: () => void;
};
export function ProductCatalog({
  products,
  busy,
  loading,
  error,
  onAdd,
  onRetry,
  onCart,
}: Props) {
  const [group, setGroup] = useState("delster");
  const [selection, setSelection] = useState<Record<string, number>>({
    delster: 0,
    dadli: 0,
  });
  const touch = useRef<{ x: number; y: number } | null>(null);
  const items = products
    .filter((p) => catalogDisplay[p.asset]?.group === group)
    .sort(
      (a, b) =>
        Object.keys(catalogDisplay).indexOf(a.asset) -
        Object.keys(catalogDisplay).indexOf(b.asset),
    );
  const index = (selection[group] ?? 0) % (items.length || 1);
  const product = items[index];
  const display =
    product && (catalogDisplay[product.asset] ?? catalogDisplay.tropical);
  const choose = (next: number) =>
    setSelection((s) => ({
      ...s,
      [group]: (next + items.length) % items.length,
    }));
  return (
    <section
      id="shop"
      className="shop-section catalog"
      aria-labelledby="shop-heading"
      style={
        {
          "--catalog-color": display?.color ?? "#d6eac6",
          "--catalog-accent": display?.accent ?? "#236348",
        } as CSSProperties
      }
    >
      <div className="shop-heading">
        <div>
          <span className="small-label">از اینجا، به جمع شما</span>
          <h2 id="shop-heading">کدام طعم، حالِ توست؟</h2>
        </div>
        <button className="text-button" onClick={onCart}>
          مشاهده سبد خرید <ShoppingBag size={18} />
        </button>
      </div>
      <div className="catalog-toolbar">
        <div className="catalog-groups" role="group" aria-label="گروه محصولات">
          <button
            aria-pressed={group === "delster"}
            onClick={() => setGroup("delster")}
          >
            دلستر <span>مالت بدون الکل</span>
          </button>
          <button
            aria-pressed={group === "dadli"}
            onClick={() => setGroup("dadli")}
          >
            دادلی <span>نوشیدنی میوه‌ای</span>
          </button>
        </div>
        <Link className="text-button" href="/products">
          کشف همه محصولات
        </Link>
      </div>
      {product && display ? (
        <>
          <div
            className="catalog-carousel"
            role="region"
            aria-roledescription="چرخ‌وفلک"
            aria-label="انتخاب محصول"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                choose(index + (e.key === "ArrowLeft" ? 1 : -1));
              }
            }}
            onTouchStart={(e) => {
              touch.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
              };
            }}
            onTouchEnd={(e) => {
              if (!touch.current) return;
              const dx = e.changedTouches[0].clientX - touch.current.x;
              const dy = e.changedTouches[0].clientY - touch.current.y;
              if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy))
                choose(index + (dx > 0 ? -1 : 1));
              touch.current = null;
            }}
          >
            <span className="catalog-word" aria-hidden="true" dir="ltr">
              {display.latin}
            </span>
            <div className="catalog-pedestal" aria-hidden="true" />
            {items.map((p, i) => {
              const offset = (i - index + items.length) % items.length;
              const position =
                offset === 0
                  ? "center"
                  : offset === 1
                    ? "next"
                    : offset === items.length - 1
                      ? "previous"
                      : "hidden";
              return (
                <button
                  key={p.id}
                  className={`catalog-item catalog-item-${position}`}
                  tabIndex={
                    position === "hidden" || position === "center" ? -1 : 0
                  }
                  aria-hidden={position === "hidden"}
                  aria-label={`انتخاب ${p.name}`}
                  aria-current={position === "center" ? "true" : undefined}
                  onClick={() => choose(i)}
                >
                  <img
                    src={productPoster(p.asset)}
                    alt={p.name}
                    width={800}
                    height={1000}
                    loading="lazy"
                  />
                  <span>{p.name}</span>
                </button>
              );
            })}
            <button
              className="catalog-arrow catalog-prev"
              aria-label="محصول قبلی"
              disabled={items.length < 2}
              onClick={() => choose(index - 1)}
            >
              <ChevronRight />
            </button>
            <button
              className="catalog-arrow catalog-next"
              aria-label="محصول بعدی"
              disabled={items.length < 2}
              onClick={() => choose(index + 1)}
            >
              <ChevronLeft />
            </button>
            <span className="catalog-count">
              {number(index + 1)} / {number(items.length)}
            </span>
          </div>
          <div
            className="catalog-product-links"
            role="group"
            aria-label="همه طعم‌های این گروه"
          >
            {items.map((p, i) => (
              <button
                key={p.id}
                aria-pressed={i === index}
                onClick={() => choose(i)}
              >
                {p.name.replace(/^(دلستر|دادلی) /, "")}
              </button>
            ))}
          </div>
          <div className="catalog-detail" key={product.id}>
            <div className="catalog-description">
              <span className="small-label">انتخاب فعلی شما</span>
              <h3 aria-live="polite">{product.name}</h3>
              <p>{display.notes}</p>
              <dl className="product-specs">
                <div>
                  <dt>حجم هر عدد</dt>
                  <dd>{display.volume}</dd>
                </div>
                <div>
                  <dt>بسته‌بندی</dt>
                  <dd>{display.packaging}</dd>
                </div>
                <div>
                  <dt>خانواده</dt>
                  <dd>
                    {group === "delster" ? "نوشیدنی مالت" : "نوشیدنی میوه‌ای"}
                  </dd>
                </div>
              </dl>
              <details className="product-ingredients">
                <summary>ترکیبات و اطلاعات محصول</summary>
                <p>{product.description}</p>
                <p>
                  فهرست کامل و تأییدشدهٔ ترکیبات این محصول هنوز ثبت نشده است.
                  برای ترکیبات، مواد حساسیت‌زا و ارزش غذایی، برچسب روی محصول را
                  بررسی کنید.
                </p>
              </details>
            </div>
            <div className="catalog-purchase">
              <PurchaseControls product={product} busy={busy} onAdd={onAdd} />
              <p className="fine-print">
                قیمت‌ها و پرداخت در این فروشگاه نمایشی هستند.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="catalog-empty" role="status">
          {loading
            ? "در حال دریافت طعم‌ها…"
            : "محصولی در این گروه در دسترس نیست."}
        </div>
      )}
      {error && (
        <div role="alert" className="error-message">
          {error}
          <button className="text-button" onClick={onRetry}>
            تلاش دوباره
          </button>
        </div>
      )}
    </section>
  );
}
