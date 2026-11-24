"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { api, errorMessage, unwrap, type Cart } from "@/lib/api";
import { productPoster } from "@/lib/catalog-display";
import { number, toman } from "@/lib/money";
export function CartDrawer({
  open,
  onClose,
  cart,
  busy,
  error,
  onQuantity,
  onCheckedOut,
}: {
  open: boolean;
  onClose: () => void;
  cart: Cart;
  busy: boolean;
  error: string;
  onQuantity: (id: string, quantity: number) => Promise<boolean>;
  onCheckedOut: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const key = useRef("");
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open) {
      el.showModal();
      const prior = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prior;
        el.close();
      };
    }
    el.close();
  }, [open]);
  async function checkout() {
    setPaying(true);
    setCheckoutError("");
    if (!key.current) key.current = crypto.randomUUID();
    try {
      const order = unwrap(
        await api.POST("/api/v1/checkout", {
          body: { idempotency_key: key.current },
        }),
      );
      key.current = "";
      onCheckedOut();
      onClose();
      router.push(`/orders/${order.id}`);
    } catch (e) {
      setCheckoutError(errorMessage(e));
    } finally {
      setPaying(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="cart-drawer"
      aria-labelledby="cart-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <div className="drawer-inner">
        <div className="drawer-heading">
          <h2 id="cart-title">سبد خرید</h2>
          <button
            className="icon-button"
            aria-label="بستن سبد خرید"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <p className="muted">محصولات انتخاب‌شده</p>
        {cart.items.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={50} />
            <h3>سبد خرید شما خالی است.</h3>
            <button className="button dark" onClick={onClose}>
              مشاهده محصولات
            </button>
          </div>
        ) : (
          <>
            <ul className="cart-items">
              {cart.items.map((item) => (
                <li key={item.variant_id}>
                  <img
                    src={productPoster(item.asset)}
                    width="80"
                    height="100"
                    alt=""
                  />
                  <div className="cart-item-info">
                    <h3>{item.product_name}</h3>
                    <p>{item.variant_name}</p>
                    <strong>{toman(item.unit_price_rial)} تومان</strong>
                    <div className="cart-item-actions">
                      <div className="quantity-control">
                        <button
                          aria-label={`افزایش ${item.product_name}`}
                          disabled={busy || paying || item.quantity >= 24}
                          onClick={() =>
                            void onQuantity(item.variant_id, item.quantity + 1)
                          }
                        >
                          <Plus size={15} />
                        </button>
                        <output>{number(item.quantity)}</output>
                        <button
                          aria-label={`کاهش ${item.product_name}`}
                          disabled={busy || paying || item.quantity <= 1}
                          onClick={() =>
                            void onQuantity(item.variant_id, item.quantity - 1)
                          }
                        >
                          <Minus size={15} />
                        </button>
                      </div>
                      <button
                        className="icon-button"
                        aria-label={`حذف ${item.product_name}`}
                        disabled={busy || paying}
                        onClick={() => void onQuantity(item.variant_id, 0)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="cart-summary">
              <div>
                <span>مجموع سبد</span>
                <strong>{toman(cart.total_rial)} تومان</strong>
              </div>
              <p>ارسال و پرداخت، صرفاً شبیه‌سازی می‌شوند.</p>
              <button
                className="button dark"
                disabled={busy || paying}
                onClick={() => void checkout()}
              >
                {paying ? "در حال رزرو…" : "ادامه و پرداخت نمایشی"}
              </button>
            </div>
          </>
        )}
        {(error || checkoutError) && (
          <p role="alert" className="error-message">
            {checkoutError || error}
          </p>
        )}
      </div>
    </dialog>
  );
}
