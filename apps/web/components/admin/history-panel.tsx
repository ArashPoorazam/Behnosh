import type { Audit, Movement } from "@/lib/api";
import { date, number } from "@/lib/money";
export function HistoryPanel({
  movements,
  audit,
}: {
  movements: Movement[];
  audit: Audit[];
}) {
  return (
    <>
      <section className="panel">
        <h2>گردش موجودی</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>انبار</th>
                <th>SKU</th>
                <th>تغییر</th>
                <th>دلیل</th>
                <th>زمان</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>{m.warehouse}</td>
                  <td>
                    <bdi>{m.sku}</bdi>
                  </td>
                  <td>
                    <bdi>
                      {m.delta > 0 ? "+" : ""}
                      {number(m.delta)}
                    </bdi>
                  </td>
                  <td>{m.reason}</td>
                  <td>{date(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2>رویدادهای مدیریتی</h2>
        {audit.length === 0 ? (
          <p className="muted">هنوز تغییری ثبت نشده است.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>مدیر</th>
                  <th>عملیات</th>
                  <th>جزئیات</th>
                  <th>زمان</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((a) => (
                  <tr key={a.id}>
                    <td>{a.actor}</td>
                    <td>
                      <bdi>{a.action}</bdi>
                    </td>
                    <td>
                      <bdi>{a.detail}</bdi>
                    </td>
                    <td>{date(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
