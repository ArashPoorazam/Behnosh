"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, RotateCcw } from "lucide-react";
import { api, errorMessage, unwrap, type Order } from "@/lib/api";
import { date, number, orderStatus, toman } from "@/lib/money";
import { SimpleHeader } from "./simple-header";
export function OrderDetail({ id }: { id: string }) {
  const [order, setOrder] = useState<Order>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const attempt = useRef<{
    key: string;
    scenario: "success" | "failure" | "cancel";
  } | null>(null);
  const load = useCallback(async () => {
    try {
      setOrder(
        unwrap(
          await api.GET("/api/v1/orders/{id}", { params: { path: { id } } }),
        ),
      );
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (order?.status !== "pending") return;
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, [order?.status, load]);
  async function pay(scenario: "success" | "failure" | "cancel") {
    setBusy(true);
    setError("");
    setNotice("");
    if (!attempt.current || attempt.current.scenario !== scenario)
      attempt.current = { key: crypto.randomUUID(), scenario };
    try {
      const next = unwrap(
        await api.POST("/api/v1/orders/{id}/payments", {
          params: { path: { id } },
          body: { scenario, idempotency_key: attempt.current.key },
        }),
      );
      setOrder(next);
      attempt.current = null;
      setNotice(
        scenario === "failure"
          ? "پرداخت ناموفق شبیه‌سازی شد. تا پایان مهلت می‌توانی دوباره تلاش کنی."
          : scenario === "cancel"
            ? "سفارش لغو و موجودی آزاد شد."
            : "پرداخت نمایشی موفق بود. هیچ مبلغ واقعی کسر نشده است.",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <SimpleHeader />
      <main id="main" className="page-shell">
        <Link className="text-button" href="/orders">
          همه سفارش‌ها
        </Link>
        <h1 className="page-title">
          {order && order.status !== "pending"
            ? "جزئیات سفارش"
            : "پرداخت نمایشی"}
        </h1>
        <div className="demo-banner">
          <strong>این یک شبیه‌ساز پرداخت است.</strong> اطلاعات بانکی لازم نیست و
          هیچ مبلغی از شما دریافت نمی‌شود.
        </div>
        {error && (
          <div role="alert" className="error-message">
            {error}
            <button className="text-button" onClick={() => void load()}>
              تازه‌سازی سفارش
            </button>
          </div>
        )}
        {!order ? (
          <p className="loading">در حال دریافت سفارش…</p>
        ) : (
          <div className="order-layout">
            <section className="panel">
              <h2>انتخاب‌های تو</h2>
              <ul className="order-lines">
                {order.items.map((item) => (
                  <li key={item.variant_id}>
                    <div>
                      <strong>{item.product_name}</strong>
                      <small>
                        {item.variant_name} · تعداد {number(item.quantity)}
                      </small>
                    </div>
                    <span>
                      {toman(item.unit_price_rial)} تومان
                      <small>قیمت هر واحد</small>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="order-total">
                <span>مبلغ سفارش</span>
                <strong>{toman(order.total_rial)} تومان</strong>
              </div>
              <hr className="soft-rule" />
              <div className="order-meta">
                شناسه سفارش: <bdi>{order.id}</bdi>
                <br />
                ثبت‌شده در {date(order.created_at)}
                <br />
                {order.status === "pending" && (
                  <>مهلت رزرو: {date(order.expires_at)}</>
                )}
              </div>
              {order.payments.length > 0 && (
                <>
                  <h3 className="history-heading">تاریخچه پرداخت نمایشی</h3>
                  <ul className="payment-history">
                    {order.payments.map((p) => (
                      <li key={p.id}>
                        {p.status === "succeeded"
                          ? "موفق"
                          : p.status === "failed"
                            ? "ناموفق"
                            : "لغوشده"}{" "}
                        · {date(p.created_at)}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
            <aside className="panel">
              <span className={`status-badge status-${order.status}`}>
                {orderStatus[order.status]}
              </span>
              {order.status === "pending" ? (
                <>
                  <h2 className="history-heading">نتیجه را انتخاب کن</h2>
                  <p className="payment-note">
                    موجودی برای ۱۵ دقیقه رزرو شده است. شکست پرداخت، امکان تلاش
                    دوباره را حفظ می‌کند.
                  </p>
                  <div className="payment-options">
                    <button
                      disabled={busy}
                      className="button dark"
                      onClick={() => void pay("success")}
                    >
                      <Check size={18} /> پرداخت موفق نمایشی
                    </button>
                    <button
                      disabled={busy}
                      className="button outline"
                      onClick={() => void pay("failure")}
                    >
                      <RotateCcw size={18} /> شبیه‌سازی پرداخت ناموفق
                    </button>
                    <button
                      disabled={busy}
                      className="text-button"
                      onClick={() => void pay("cancel")}
                    >
                      لغو سفارش و آزادسازی موجودی
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <Check size={40} />
                  <p>
                    {order.status === "cancelled" || order.status === "expired"
                      ? "رزرو این سفارش آزاد شده است."
                      : "سفارش ثبت شد؛ وضعیت آماده‌سازی از همین صفحه قابل پیگیری است."}
                  </p>
                  <Link className="button dark" href="/">
                    بازگشت به طعم‌ها
                  </Link>
                </div>
              )}
              {notice && (
                <p role="status" className="success-message payment-result">
                  {notice}
                </p>
              )}
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
