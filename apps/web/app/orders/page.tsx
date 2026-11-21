"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, errorMessage, unwrap, type Order } from "@/lib/api";
import { date, number, orderStatus, toman } from "@/lib/money";
import { SimpleHeader } from "@/components/simple-header";
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(
        unwrap(
          await api.GET("/api/v1/orders", {
            params: { query: { offset, limit: 10 } },
          }),
        ),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [offset]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <>
      <SimpleHeader />
      <main id="main" className="page-shell">
        <span className="section-kicker">ردِ لحظه‌های خوش‌طعم</span>
        <h1 className="page-title">سفارش‌های من</h1>
        <p className="muted">
          سفارش‌های این مرورگر · خرید و پرداخت کاملاً نمایشی
        </p>
        {error && (
          <div role="alert" className="error-message">
            {error}
            <button className="text-button" onClick={() => void load()}>
              تلاش دوباره
            </button>
          </div>
        )}
        {loading ? (
          <p className="loading">در حال دریافت سفارش‌ها…</p>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <h2>هنوز سفارشی نداری.</h2>
            <Link className="button dark" href="/#flavors">
              انتخاب طعم
            </Link>
          </div>
        ) : (
          orders.map((o) => (
            <Link className="order-card" key={o.id} href={`/orders/${o.id}`}>
              <div>
                <h2>
                  سفارش <bdi>{o.id.slice(0, 8)}</bdi>
                </h2>
                <p>{date(o.created_at)}</p>
              </div>
              <div>
                <span className={`status-badge status-${o.status}`}>
                  {orderStatus[o.status]}
                </span>
                <strong>{toman(o.total_rial)} تومان</strong>
              </div>
            </Link>
          ))
        )}
        <div className="pagination">
          <button
            disabled={offset === 0 || loading}
            onClick={() => setOffset((n) => n - 10)}
          >
            قبلی
          </button>
          <span>{number(offset / 10 + 1)}</span>
          <button
            disabled={orders.length < 10 || loading}
            onClick={() => setOffset((n) => n + 10)}
          >
            بعدی
          </button>
        </div>
      </main>
    </>
  );
}
