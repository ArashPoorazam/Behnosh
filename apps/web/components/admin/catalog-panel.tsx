"use client";
import { useState } from "react";
import { api, unwrap, type Product, type Variant } from "@/lib/api";
import { toman } from "@/lib/money";
function VariantEditor({
  variant,
  productName,
  run,
}: {
  variant: Variant;
  productName: string;
  run: (operation: () => Promise<void>) => Promise<void>;
}) {
  const [name, setName] = useState(variant.name);
  const [price, setPrice] = useState(variant.price_rial);
  const [active, setActive] = useState(variant.active);
  return (
    <form
      className="panel admin-form"
      onSubmit={(e) => {
        e.preventDefault();
        void run(async () => {
          unwrap(
            await api.PATCH("/api/v1/admin/variants/{id}", {
              params: { path: { id: variant.id } },
              body: { name, price_rial: price, active },
            }),
          );
        });
      }}
    >
      <h3>
        {productName} · <bdi>{variant.sku}</bdi>
      </h3>
      <label>
        نام بسته
        <input
          required
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        قیمت دقیق به ریال
        <input
          dir="ltr"
          type="number"
          min="10"
          max="1000000000"
          step="10"
          required
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <small>{toman(price)} تومان</small>
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />{" "}
        قابل فروش
      </label>
      <button className="button dark">ذخیره محصول</button>
    </form>
  );
}
export function CatalogPanel({
  products,
  run,
}: {
  products: Product[];
  run: (operation: () => Promise<void>) => Promise<void>;
}) {
  return (
    <>
      <p className="demo-banner">
        قیمت جدید فقط در سفارش‌های بعدی اعمال می‌شود. اطلاعات سفارش‌های قبلی
        ثابت می‌ماند.
      </p>
      <div className="catalog-grid">
        {products.flatMap((p) =>
          p.variants.map((v) => (
            <VariantEditor
              key={v.id}
              variant={v}
              productName={p.name}
              run={run}
            />
          )),
        )}
      </div>
    </>
  );
}
