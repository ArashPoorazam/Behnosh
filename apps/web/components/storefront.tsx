"use client";
import Link from "next/link";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ScrollHero, FlavorStory } from "./scroll-story";
import { ProductCatalog } from "./product-catalog";
import { DadliExperience } from "./dadli-experience";
import { CartDrawer } from "./cart-drawer";
import { useCommerce } from "@/lib/use-commerce";
import { number } from "@/lib/money";
export default function Storefront() {
  const [menu, setMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const commerce = useCommerce();
  useEffect(() => {
    const escape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  const add = async (id: string, quantity: number) =>
    commerce.setQuantity(
      id,
      (commerce.cart.items.find((i) => i.variant_id === id)?.quantity || 0) +
        quantity,
    );
  return (
    <div ref={root} className="beverage-site">
      <header className="showcase-header">
        <Link
          href="/"
          aria-label="دلستر، خانه"
          className="delster-wordmark"
          dir="ltr"
        >
          DELSTER<span>®</span>
        </Link>
        <nav
          id="main-nav"
          aria-label="ناوبری اصلی"
          className={`showcase-nav ${menu ? "is-open" : ""}`}
        >
          <a href="#delster" onClick={() => setMenu(false)}>
            دلستر
          </a>
          <a href="#dadli" onClick={() => setMenu(false)}>
            دادلی
          </a>
          <Link href="/products" onClick={() => setMenu(false)}>
            همه محصولات
          </Link>
          <Link href="/orders">سفارش‌های من</Link>
        </nav>
        <div className="header-actions">
          <button
            className="showcase-cart"
            onClick={() => setCartOpen(true)}
            aria-label="باز کردن سبد خرید"
          >
            <ShoppingBag size={19} />
            <span>سبد خرید</span>
            <b>
              {number(commerce.cart.items.reduce((n, i) => n + i.quantity, 0))}
            </b>
          </button>
          <button
            className="icon-button showcase-menu"
            aria-label="فهرست"
            aria-expanded={menu}
            aria-controls="main-nav"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main">
        <ScrollHero />
        <FlavorStory />
        <DadliExperience />
        <ProductCatalog
          products={commerce.products}
          busy={commerce.busy}
          loading={commerce.loading}
          error={commerce.error}
          onAdd={add}
          onRetry={() => void commerce.reload()}
          onCart={() => setCartOpen(true)}
        />
      </main>
      <footer className="showcase-footer">
        <div className="footer-top">
          <a className="delster-wordmark" href="#delster" dir="ltr">
            DELSTER<span>®</span>
          </a>
          <p>تنها دلستر، دلستر است</p>
          <a href="#delster">بازگشت به بالا</a>
        </div>
        <div className="footer-bottom">
          <div>
            <a href="#dadli">دادلی</a>
            <Link href="/products">همه محصولات</Link>
            <Link href="/orders">سفارش‌های من</Link>
            <Link href="/admin">مدیریت فروشگاه</Link>
          </div>
          <span>تجربه‌ی نمایشی محصولات · ۱۴۰۵</span>
        </div>
      </footer>
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={commerce.cart}
        busy={commerce.busy}
        error={commerce.error}
        onQuantity={commerce.setQuantity}
        onCheckedOut={() => void commerce.reload()}
      />
    </div>
  );
}
