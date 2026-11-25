"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { catalogDisplay } from "@/lib/catalog-display";
import { number, toman } from "@/lib/money";
import type { Product } from "@/lib/api";
import { useBrandCommerce } from "./brand-commerce";

export function BrandPurchase({ sourceId }: { sourceId: string }) {
  const { products, loading, error, reload } = useBrandCommerce();
  const product = products.find(
    (p) =>
      (catalogDisplay[p.asset]?.sourceId ??
        p.asset.replace(/^catalog-/, "")) === sourceId,
  );
  if (loading && !product)
    return (
      <div className="brand-purchase purchase-placeholder" role="status">
        در حال دریافت قیمت و موجودی…
      </div>
    );
  if (!product)
    return (
      <div className="brand-purchase purchase-placeholder" role="status">
        <p>{error || "این محصول فعلاً قابل سفارش نیست."}</p>
        {error && <button onClick={() => void reload()}>تلاش دوباره</button>}
      </div>
    );
  return <PurchaseForm key={product.id} product={product} />;
}

function PurchaseForm({ product }: { product: Product }) {
  const { cart, busy, error, setQuantity, openCart } = useBrandCommerce();
  const variants = product.variants.filter((v) => v.active);
  const [variantId, setVariantId] = useState(variants[0]?.id);
  const [quantity, setQuantityState] = useState(1);
  const [added, setAdded] = useState(false);
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  if (!variant)
    return <p className="brand-purchase">این محصول فعلاً قابل سفارش نیست.</p>;
  const inCart =
    cart.items.find((item) => item.variant_id === variant.id)?.quantity ?? 0;
  const limit = Math.max(0, Math.min(24 - inCart, variant.available - inCart));
  const changeQuantity = (next: number) => {
    setQuantityState(next);
    setAdded(false);
  };
  return (
    <div className="brand-purchase" data-source={product.asset}>
      <fieldset className="brand-pack-options" disabled={busy}>
        <legend>بسته‌بندی</legend>
        {variants.map((v) => (
          <label
            key={v.id}
            className={v.id === variant.id ? "is-selected" : ""}
          >
            <input
              type="radio"
              name={`brand-pack-${product.id}`}
              checked={v.id === variant.id}
              onChange={() => {
                setVariantId(v.id);
                changeQuantity(1);
              }}
            />
            {v.name}
          </label>
        ))}
      </fieldset>
      <div className="brand-price">
        <div>
          <strong>{toman(variant.price_rial * quantity)}</strong>
          <span> تومان</span>
        </div>
        <span>
          {variant.available > 0
            ? `${number(quantity * variant.units)} عدد نوشیدنی`
            : "ناموجود"}
        </span>
      </div>
      <div className="brand-buy-row">
        <div className="brand-quantity">
          <button
            type="button"
            aria-label="افزایش تعداد"
            disabled={busy || quantity >= limit}
            onClick={() => changeQuantity(quantity + 1)}
          >
            <Plus size={18} />
          </button>
          <output aria-label="تعداد">{number(quantity)}</output>
          <button
            type="button"
            aria-label="کاهش تعداد"
            disabled={busy || quantity <= 1}
            onClick={() => changeQuantity(quantity - 1)}
          >
            <Minus size={18} />
          </button>
        </div>
        <button
          className="brand-add"
          disabled={busy || quantity > limit}
          onClick={async () => {
            setAdded(false);
            if (await setQuantity(variant.id, inCart + quantity))
              setAdded(true);
          }}
        >
          {busy ? (
            <span className="spinner" />
          ) : added ? (
            <Check size={19} />
          ) : (
            <ShoppingBag size={19} />
          )}
          {added ? "به سبد اضافه شد" : "افزودن به سبد"}
        </button>
      </div>
      <div className="brand-purchase-note">
        <small>قیمت و خرید نمایشی</small>
        {added && <button onClick={openCart}>مشاهده سبد خرید</button>}
      </div>
      <span className="sr-only" role="status">
        {added ? "محصول به سبد خرید اضافه شد." : ""}
      </span>
      {error && (
        <p className="brand-purchase-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
