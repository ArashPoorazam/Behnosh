"use client";
import { api, unwrap, type Order } from "@/lib/api";
import { date, orderStatus, toman } from "@/lib/money";
export function OrdersPanel({
  orders,
  run,
}: {
  orders: Order[];
  run: (operation: () => Promise<void>) => Promise<void>;
}) {
  return (
    <section className="panel">
      <h2>مدیریت سفارش‌ها</h2>
      {orders.length === 0 ? (
        <p className="empty-state">هنوز سفارشی ثبت نشده است.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>سفارش</th>
                <th>زمان ثبت</th>
                <th>مبلغ (تومان)</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <bdi>{o.id.slice(0, 8)}</bdi>
                  </td>
                  <td>{date(o.created_at)}</td>
                  <td>{toman(o.total_rial)}</td>
                  <td>
                    <span className={`status-badge status-${o.status}`}>
                      {orderStatus[o.status]}
                    </span>
                  </td>
                  <td>
                    {o.status === "paid" || o.status === "processing" ? (
                      <button
                        className="small-button"
                        onClick={() =>
                          void run(async () => {
                            unwrap(
                              await api.PATCH("/api/v1/admin/orders/{id}", {
                                params: { path: { id: o.id } },
                                body: {
                                  status:
                                    o.status === "paid"
                                      ? "processing"
                                      : "shipped",
                                },
                              }),
                            );
                          })
                        }
                      >
                        {o.status === "paid" ? "شروع آماده‌سازی" : "ثبت ارسال"}
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
