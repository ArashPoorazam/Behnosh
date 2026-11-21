"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Boxes,
  ClipboardList,
  Package,
  History,
  LogOut,
  RefreshCw,
} from "lucide-react";
import {
  api,
  errorMessage,
  getSession,
  setSession,
  unwrap,
  type Audit,
  type Inventory,
  type Movement,
  type Order,
  type Product,
  type Session,
} from "@/lib/api";
import { number } from "@/lib/money";
import { SimpleHeader } from "../simple-header";
import { InventoryPanel } from "./inventory-panel";
import { OrdersPanel } from "./orders-panel";
import { CatalogPanel } from "./catalog-panel";
import { HistoryPanel } from "./history-panel";
type Tab = "inventory" | "orders" | "catalog" | "history";
const tabs = [
  { id: "inventory", title: "انبار و موجودی", icon: Boxes },
  { id: "orders", title: "سفارش‌ها", icon: ClipboardList },
  { id: "catalog", title: "محصولات و قیمت", icon: Package },
  { id: "history", title: "گردش و رویدادها", icon: History },
] as const;
export function Dashboard() {
  const [session, updateSession] = useState<Session>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("inventory");
  const [offset, setOffset] = useState(0);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const reload = useCallback(async () => {
    const params = { query: { limit: 20, offset } };
    const [stock, orderData, catalog, ledger, events] = await Promise.all([
      api.GET("/api/v1/admin/inventory"),
      api.GET("/api/v1/admin/orders", { params }),
      api.GET("/api/v1/admin/catalog"),
      api.GET("/api/v1/admin/movements", { params }),
      api.GET("/api/v1/admin/audit", { params }),
    ]);
    setInventory(unwrap(stock));
    setOrders(unwrap(orderData));
    setProducts(unwrap(catalog));
    setMovements(unwrap(ledger));
    setAudit(unwrap(events));
  }, [offset]);
  useEffect(() => {
    let active = true;
    getSession()
      .then((s) => {
        if (active) updateSession(s);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!session?.admin) return;
    setLoading(true);
    reload()
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [session?.admin, reload]);
  async function run(operation: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
      await reload();
      setNotice("تغییرات ثبت شد.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function login() {
    setBusy(true);
    setError("");
    try {
      const s = unwrap(
        await api.POST("/api/v1/login", { body: { username, password } }),
      );
      setSession(s);
      updateSession(s);
      setPassword("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      const s = unwrap(await api.POST("/api/v1/logout"));
      setSession(s);
      updateSession(s);
      setNotice("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const totalAvailable = inventory.reduce((sum, i) => sum + i.available, 0);
  const totalReserved = inventory.reduce((sum, i) => sum + i.reserved, 0);
  const warehouses = new Set(inventory.map((i) => i.warehouse_id)).size;
  return (
    <>
      <SimpleHeader />
      <main id="main" className="admin-shell">
        <div className="admin-heading">
          <div>
            <span className="section-kicker">پشت صحنه بهنوش</span>
            <h1 className="page-title">مدیریت فروشگاه</h1>
          </div>
          {session?.admin && (
            <button
              className="button outline"
              disabled={busy}
              onClick={() => void logout()}
            >
              <LogOut size={17} /> خروج
            </button>
          )}
        </div>
        {error && (
          <div role="alert" className="error-message">
            {error}
          </div>
        )}
        {notice && (
          <p role="status" className="success-message">
            {notice}
          </p>
        )}
        {!session && loading ? (
          <p className="loading">در حال بررسی دسترسی…</p>
        ) : !session?.admin ? (
          <form
            className="panel admin-form login-form"
            onSubmit={(e) => {
              e.preventDefault();
              void login();
            }}
          >
            <h2>ورود مدیر</h2>
            <p className="muted">ورود با حساب تنظیم‌شده در راه‌اندازی محلی.</p>
            <label>
              نام کاربری
              <input
                dir="ltr"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label>
              گذرواژه
              <input
                dir="ltr"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="button dark" disabled={busy}>
              {busy ? "در حال بررسی…" : "ورود به مدیریت"}
            </button>
            <p className="fine-print">تمام عملیات این محیط، نمایشی است.</p>
          </form>
        ) : (
          <>
            <div className="admin-stats">
              <div>
                <span>موجودی قابل فروش</span>
                <strong>{number(totalAvailable)}</strong>
                <small>بسته، همه انبارها</small>
              </div>
              <div>
                <span>در انتظار پرداخت</span>
                <strong>{number(totalReserved)}</strong>
                <small>بسته رزروشده</small>
              </div>
              <div>
                <span>انبارهای فعال</span>
                <strong>{number(warehouses)}</strong>
                <small>تأمین سفارش از تهران</small>
              </div>
            </div>
            <div className="admin-toolbar">
              <nav className="admin-tabs" aria-label="بخش‌های مدیریت">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    aria-current={tab === t.id ? "page" : undefined}
                    onClick={() => {
                      setTab(t.id);
                      setOffset(0);
                      setNotice("");
                    }}
                  >
                    <t.icon size={18} />
                    {t.title}
                  </button>
                ))}
              </nav>
              <button
                className="icon-button"
                aria-label="تازه‌سازی اطلاعات"
                disabled={busy || loading}
                onClick={() => void run(async () => {})}
              >
                <RefreshCw size={18} />
              </button>
            </div>
            <fieldset
              className="admin-content"
              disabled={busy || loading}
              aria-busy={busy || loading}
            >
              {tab === "inventory" && (
                <InventoryPanel inventory={inventory} run={run} />
              )}{" "}
              {tab === "orders" && <OrdersPanel orders={orders} run={run} />}{" "}
              {tab === "catalog" && (
                <CatalogPanel products={products} run={run} />
              )}{" "}
              {tab === "history" && (
                <HistoryPanel movements={movements} audit={audit} />
              )}
            </fieldset>
            {(tab === "orders" || tab === "history") && (
              <div className="pagination">
                <button
                  disabled={offset === 0 || loading}
                  onClick={() => setOffset((n) => n - 20)}
                >
                  قبلی
                </button>
                <span>{number(offset / 20 + 1)}</span>
                <button
                  disabled={
                    loading ||
                    (tab === "orders"
                      ? orders.length < 20
                      : movements.length < 20 && audit.length < 20)
                  }
                  onClick={() => setOffset((n) => n + 20)}
                >
                  بعدی
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
