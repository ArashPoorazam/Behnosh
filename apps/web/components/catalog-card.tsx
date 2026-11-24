"use client";
import { useState, type CSSProperties } from "react";
import { ChevronDown, Plus, ShoppingBag } from "lucide-react";
import { flavorColor, type CatalogItem } from "@/lib/all-products";
import { number, toman } from "@/lib/money";
import type { Cart } from "@/lib/api";

export function CatalogCard({
  item,
  cart,
  busy,
  loading,
  onAdd,
}: {
  item: CatalogItem;
  cart: Cart;
  busy: boolean;
  loading: boolean;
  onAdd: (id: string) => Promise<void>;
}) {
  const variants = item.offer?.variants.filter((v) => v.active) ?? [];
  const [selection, setSelection] = useState("");
  const variant = variants.find((v) => v.id === selection) ?? variants[0];
  const quantity =
    cart.items.find((line) => line.variant_id === variant?.id)?.quantity ?? 0;
  const limit = variant ? Math.min(24, variant.available) : 0;
  return (
    <article
      className="shelf-card"
      style={{ "--flavor": flavorColor(item) } as CSSProperties}
      data-source-id={item.sourceId}
    >
      <div className="shelf-card-art">
        <span className="shelf-brand">{item.brand}</span>
        {quantity > 0 && (
          <span className="shelf-in-cart">
            <ShoppingBag size={13} />
            {number(quantity)} در سبد
          </span>
        )}
        <span className="shelf-art-circle" aria-hidden="true" />
        <img
          src={`/assets/catalog/${item.sourceId}-v1.webp`}
          alt={item.name}
          width={480}
          height={600}
          loading="lazy"
        />
        <span className="shelf-flavor">{item.flavor}</span>
      </div>
      <div className="shelf-card-body">
        <p className="shelf-specs">
          {item.packaging} <span>·</span> {number(item.volume)} میلی‌لیتر
        </p>
        <h3>{item.name}</h3>
        {variants.length > 1 ? (
          <div className="shelf-select shelf-pack-select">
            <select
              aria-label={`بسته‌بندی ${item.name}`}
              value={variant?.id ?? ""}
              onChange={(event) => setSelection(event.target.value)}
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                  {v.available < 1 ? " · ناموجود" : ""}
                </option>
              ))}
            </select>
            <ChevronDown size={14} />
          </div>
        ) : (
          <p className="shelf-pack-label">
            {variant
              ? "تک عددی"
              : loading
                ? "در حال دریافت قیمت…"
                : "فعلاً قابل سفارش نیست"}
          </p>
        )}
        <div className="shelf-card-bottom">
          <div className="shelf-price">
            {variant ? (
              <>
                <strong>{toman(variant.price_rial)}</strong>
                <span>تومان · نمایشی</span>
              </>
            ) : (
              <span>{loading ? "…" : "ناموجود"}</span>
            )}
          </div>
          <button
            className="shelf-add"
            aria-label={`افزودن ${item.name} به سبد`}
            disabled={busy || loading || !variant || quantity >= limit}
            onClick={() => variant && void onAdd(variant.id)}
          >
            <Plus size={18} />
            <span>
              {variant && variant.available < 1
                ? "ناموجود"
                : quantity >= limit && variant
                  ? "حداکثر"
                  : "افزودن"}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
