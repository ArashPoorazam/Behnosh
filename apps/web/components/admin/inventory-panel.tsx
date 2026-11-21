"use client";
import { useState } from "react";
import { api, unwrap, type Inventory } from "@/lib/api";
import { number } from "@/lib/money";
export function InventoryPanel({
  inventory,
  run,
}: {
  inventory: Inventory[];
  run: (operation: () => Promise<void>) => Promise<void>;
}) {
  const [selected, setSelected] = useState("");
  const [delta, setDelta] = useState(10);
  const [reason, setReason] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const item = inventory.find(
    (i) => `${i.warehouse_id}:${i.variant_id}` === selected,
  );
  return (
    <>
      <section className="panel">
        <div className="panel-title">
          <h2>موجودی انبارها</h2>
          <span className="muted">واحد شمارش: بسته قابل فروش</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>انبار</th>
                <th>محصول / بسته</th>
                <th>موجود</th>
                <th>رزرو</th>
                <th>آزاد</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((i) => (
                <tr key={`${i.warehouse_id}:${i.variant_id}`}>
                  <td>{i.warehouse_name}</td>
                  <td>
                    {i.product_name}
                    <small>
                      {i.variant_name} · <bdi>{i.sku}</bdi>
                    </small>
                  </td>
                  <td>{number(i.on_hand)}</td>
                  <td>{number(i.reserved)}</td>
                  <td>
                    <strong>{number(i.available)}</strong>
                  </td>
                  <td>
                    <button
                      className="small-button"
                      onClick={() => {
                        setSelected(`${i.warehouse_id}:${i.variant_id}`);
                        setReason("");
                      }}
                    >
                      اصلاح موجودی
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {item && (
        <form
          className="panel admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              unwrap(
                await api.POST("/api/v1/admin/inventory", {
                  body: {
                    warehouse_id: item.warehouse_id,
                    variant_id: item.variant_id,
                    delta,
                    reason,
                  },
                }),
              );
              setSelected("");
            });
          }}
        >
          <h2>
            اصلاح {item.product_name} · {item.warehouse_name}
          </h2>
          <label>
            تغییر موجودی (عدد منفی برای خروج)
            <input
              type="number"
              required
              min="-10000"
              max="10000"
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
            />
          </label>
          <label>
            دلیل تغییر
            <input
              required
              minLength={3}
              maxLength={180}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثلاً دریافت محموله جدید"
            />
          </label>
          <div className="form-actions">
            <button className="button dark">ثبت تغییر و سند انبار</button>
            <button
              type="button"
              className="text-button"
              onClick={() => setSelected("")}
            >
              انصراف
            </button>
          </div>
        </form>
      )}
      <form
        className="panel admin-form"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            unwrap(
              await api.POST("/api/v1/admin/warehouses", {
                body: { name: warehouse },
              }),
            );
            setWarehouse("");
          });
        }}
      >
        <h2>افزودن انبار</h2>
        <p className="muted">
          سفارش‌های نمایشی از انبار تهران تأمین می‌شوند. سایر انبارها برای
          مدیریت موجودی هستند.
        </p>
        <label>
          نام انبار
          <input
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
            required
            minLength={3}
            maxLength={60}
          />
        </label>
        <button className="button dark">ایجاد انبار</button>
      </form>
    </>
  );
}
