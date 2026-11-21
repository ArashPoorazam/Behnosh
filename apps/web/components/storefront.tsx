"use client";
import Link from "next/link";
import {
  ShoppingBag,
  Menu,
  X,
  Sparkles,
  Droplets,
  Leaf,
  Plus,
  Check,
} from "lucide-react";
import { useState } from "react";
import { ProductStage } from "./product-stage";
import { PurchaseControls } from "./purchase-controls";
import { CartDrawer } from "./cart-drawer";
import { useCommerce } from "@/lib/use-commerce";
import { number } from "@/lib/money";
export default function Storefront() {
  const [asset, setAsset] = useState("tropical");
  const [menu, setMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const commerce = useCommerce();
  const product = commerce.products.find((p) => p.asset === asset);
  const add = async (id: string, quantity: number) => {
    const existing =
      commerce.cart.items.find((i) => i.variant_id === id)?.quantity || 0;
    return commerce.setQuantity(id, existing + quantity);
  };
  return (
    <>
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="بهنوش، خانه">
          بهنوش<span>BEHNOSH</span>
        </Link>
        <nav aria-label="ناوبری اصلی" className={menu ? "nav is-open" : "nav"}>
          <a onClick={() => setMenu(false)} href="#flavors">
            دنیای طعم‌ها
          </a>
          <a onClick={() => setMenu(false)} href="#ingredients">
            داستان یک جرعه
          </a>
          <Link href="/orders">سفارش‌های من</Link>
        </nav>
        <div className="header-actions">
          <button
            className="cart-trigger"
            aria-label="باز کردن سبد خرید"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={19} />
            <span>سبد خرید</span>
            <b>
              {number(commerce.cart.items.reduce((n, i) => n + i.quantity, 0))}
            </b>
          </button>
          <button
            className="icon-button menu-trigger"
            aria-label="فهرست"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main">
        <div id="story" className={`story theme-${asset}`}>
          <ProductStage asset={asset} />
          <section className="hero story-section">
            <div className="hero-topline">
              <span className="eyebrow">
                <span className="tiny-sun" /> حال خوب، از یک جرعه شروع می‌شه
              </span>
              <span className="latin-note" dir="ltr">
                A LITTLE SIP. A NEW MOOD.
              </span>
            </div>
            <div className="hero-title">
              <h1>
                درِ لحظه رو
                <br />
                <span>باز کن.</span>
              </h1>
              <span className="outline-word" aria-hidden="true">
                تـــازه
              </span>
            </div>
            <div className="hero-bottom">
              <div className="hero-copy">
                <p>
                  از روزمرگی فاصله بگیر.
                  <br />
                  با بهنوش، یه طعم تازه به لحظه‌هات بده.
                </p>
                <a href="#flavors" className="button dark">
                  طعم خودت رو پیدا کن <Sparkles size={18} />
                </a>
              </div>
              <div className="round-seal">
                <span>خنک بنوش</span>
                <Sparkles size={27} />
                <span>تازه زندگی کن</span>
              </div>
            </div>
            <div className="scroll-note">
              <span className="scroll-line" />
              برای کشف طعم، پایین بیا
            </div>
            <div className="floating-orbit orbit-one" />
            <div className="floating-orbit orbit-two" />
          </section>
          <div className="ticker">
            <div>
              یه جرعه تازگی <span>✳</span> یه دنیا حال خوب <span>✳</span> به
              وقت بهنوش <span>✳</span> یه جرعه تازگی <span>✳</span> یه دنیا
              حال خوب <span>✳</span>
            </div>
          </div>
          <section id="ingredients" className="ingredients story-section">
            <div className="section-kicker">از نزدیک، خوش‌طعم‌تر</div>
            <div className="ingredients-copy">
              <h2>
                حال خوب،
                <br />
                توی جزئیاته.
              </h2>
              <p>
                صدای باز شدن قوطی. خنکی اولین جرعه.
                <br />
                همون مکث کوچیکی که روزت لازم داره.
              </p>
              <div className="ingredient-list">
                <div>
                  <Leaf />
                  <span>
                    <strong>شخصیت مالت</strong>
                    <small>پایه آشنای یک نوشیدنی دوست‌داشتنی</small>
                  </span>
                </div>
                <div>
                  <Sparkles />
                  <span>
                    <strong>حال‌وهوای استوایی</strong>
                    <small>برای لحظه‌هایی با طعمی متفاوت</small>
                  </span>
                </div>
                <div>
                  <Droplets />
                  <span>
                    <strong>خنک، کنار لحظه‌های تو</strong>
                    <small>با یک لیوان یخ، آماده یک مکث تازه</small>
                  </span>
                </div>
              </div>
            </div>
            <Sparkles className="giant-asterisk" aria-hidden="true" />
          </section>
          <section id="flavors" className="flavors story-section">
            <div className="flavor-heading">
              <span className="section-kicker">هر حال، یک انتخاب</span>
              <h2>
                امروز،
                <br />
                چه طعمی هستی؟
              </h2>
              <p>استوایی و سرزنده یا کلاسیک و آشنا؟</p>
            </div>
            <div className="flavor-options">
              <button
                onClick={() => setAsset("tropical")}
                aria-pressed={asset === "tropical"}
                className={`flavor-card tropical ${asset === "tropical" ? "selected" : ""}`}
              >
                <span className="flavor-index" dir="ltr">
                  TROPICAL
                </span>
                <strong>استوایی</strong>
                <span>یه سفر کوتاه به حال خوب</span>
                <div className="flavor-dot" />
                {asset === "tropical" ? (
                  <Check size={20} />
                ) : (
                  <Plus size={20} />
                )}
              </button>
              <button
                onClick={() => setAsset("classic")}
                aria-pressed={asset === "classic"}
                className={`flavor-card classic ${asset === "classic" ? "selected" : ""}`}
              >
                <span className="flavor-index" dir="ltr">
                  ORIGINAL MALT
                </span>
                <strong>کلاسیک</strong>
                <span>همون طعم آشنای همیشگی</span>
                <div className="flavor-dot" />
                {asset === "classic" ? <Check size={20} /> : <Plus size={20} />}
              </button>
            </div>
          </section>
          <section id="purchase" className="purchase story-section">
            <div className="purchase-copy">
              <span className="section-kicker">لحظه‌ات رو تازه کن</span>
              <h2>{asset === "tropical" ? "دلستر استوایی" : "دلستر کلاسیک"}</h2>
              <p>
                انتخابت رو به سبد اضافه کن؛
                <br />
                بقیه‌اش یک تجربه ساده و نمایشی است.
              </p>
              {product ? (
                <PurchaseControls
                  key={product.id}
                  product={product}
                  busy={commerce.busy}
                  onAdd={add}
                />
              ) : (
                <div className="purchase-placeholder">
                  {commerce.loading
                    ? "در حال دریافت محصولات…"
                    : "محصولی برای نمایش نیست."}
                </div>
              )}
              {commerce.error && (
                <div role="alert" className="error-message">
                  {commerce.error}
                  <button
                    className="text-button"
                    onClick={() => void commerce.reload()}
                  >
                    تلاش دوباره
                  </button>
                </div>
              )}
              <p className="fine-print">
                این فروشگاه یک نمونه نمایشی است؛ پرداخت واقعی انجام نمی‌شود.
              </p>
            </div>
          </section>
        </div>
        <section className="closing">
          <span className="section-kicker">کنار هم، خوش‌طعم‌تره</span>
          <h2>
            به سلامتیِ
            <br />
            <span>لحظه‌های ساده.</span>
          </h2>
          <a className="button light" href="#flavors">
            یه طعم تازه انتخاب کن <Sparkles size={18} />
          </a>
          <div className="closing-bubbles" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <Link href="/" className="wordmark">
          بهنوش<span>BEHNOSH</span>
        </Link>
        <p>یک جرعه، حال تازه.</p>
        <div>
          <Link href="/admin">مدیریت فروشگاه</Link>
          <span>تجربه نمایشی · بدون پرداخت واقعی</span>
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
    </>
  );
}
