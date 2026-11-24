"use client";
import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/api";
import { number, toman } from "@/lib/money";
export function PurchaseControls({
  product,
  busy,
  onAdd,
}: {
  product: Product;
  busy: boolean;
  onAdd: (variantID: string, quantity: number) => Promise<boolean>;
}) {
  const [variantID, setVariantID] = useState(product.variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const variant =
    product.variants.find((v) => v.id === variantID) || product.variants[0];
  if (!variant) return <p>این محصول فعلاً قابل سفارش نیست.</p>;
  return (
    <div className="purchase-controls">
      <fieldset className="pack-options">
        <legend>بسته‌بندی دلخواهت</legend>
        {product.variants.map((v) => (
          <label key={v.id} className={variant.id === v.id ? "selected" : ""}>
            <input
              type="radio"
              name={`pack-${product.id}`}
              value={v.id}
              checked={variant.id === v.id}
              onChange={() => {
                setVariantID(v.id);
                setQuantity(1);
                setAdded(false);
              }}
            />
            {v.name}
          </label>
        ))}
      </fieldset>
      <div className="price-row">
        <div>
          <strong>{toman(variant.price_rial)}</strong>
          <span> تومان</span>
          <small>قیمت هر {variant.units > 1 ? "بسته" : "عدد"} · نمایشی</small>
        </div>
        <span className={`stock ${variant.available === 0 ? "out" : ""}`}>
          {variant.available > 0 ? "موجود در انبار" : "ناموجود"}
        </span>
      </div>
      <div className="purchase-total" aria-live="polite" aria-atomic="true">
        <div>
          <span>جمع انتخاب شما</span>
          <small>
            {number(quantity)} {variant.units > 1 ? "بسته" : "عدد"}
            {variant.units > 1
              ? ` · ${number(quantity * variant.units)} نوشیدنی`
              : ""}
          </small>
        </div>
        <strong>
          {toman(variant.price_rial * quantity)} <span>تومان</span>
        </strong>
      </div>
      <div className="buy-row">
        <div className="quantity-control">
          <button
            aria-label="افزایش تعداد"
            disabled={quantity >= Math.min(24, variant.available) || busy}
            onClick={() => {
              setQuantity((q) => q + 1);
              setAdded(false);
            }}
          >
            <Plus size={17} />
          </button>
          <output aria-label="تعداد">{number(quantity)}</output>
          <button
            aria-label="کاهش تعداد"
            disabled={quantity <= 1 || busy}
            onClick={() => {
              setQuantity((q) => q - 1);
              setAdded(false);
            }}
          >
            <Minus size={17} />
          </button>
        </div>
        <button
          className="button dark add-to-cart"
          disabled={busy || variant.available < quantity}
          onClick={async () => {
            setAdded(false);
            if (await onAdd(variant.id, quantity)) setAdded(true);
          }}
        >
          {busy ? (
            <span className="spinner" />
          ) : added ? (
            <Check size={20} />
          ) : (
            <ShoppingBag size={20} />
          )}{" "}
          {added ? "به سبد اضافه شد" : "افزودن به سبد"}
        </button>
      </div>
      <span className="sr-only" role="status">
        {added ? "محصول به سبد خرید اضافه شد." : ""}
      </span>
    </div>
  );
}
