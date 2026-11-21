"use client";
import Link from "next/link";
import { ShoppingBag, Menu, X, Snowflake, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ShowcaseStage } from "./showcase-stage";
import { DadliExperience } from "./dadli-experience";
import { PurchaseControls } from "./purchase-controls";
import { CartDrawer } from "./cart-drawer";
import { useCommerce } from "@/lib/use-commerce";
import { number } from "@/lib/money";
import { posterUrl } from "@/lib/showcase";
export default function Storefront() {
  const [asset, setAsset] = useState("tropical");
  const [menu, setMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const commerce = useCommerce();
  const product = commerce.products.find((p) => p.asset === asset);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.from(".editorial-line", {
          opacity: 0.22,
          y: 25,
          stagger: 0.2,
          scrollTrigger: {
            trigger: ".editorial",
            start: "top 80%",
            end: "center 45%",
            scrub: 1,
          },
        });
        gsap.fromTo(
          ".cold-products",
          { y: 20 },
          {
            y: -10,
            ease: "none",
            scrollTrigger: {
              trigger: ".cold-world",
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          },
        );
      }, root);
      return () => ctx.revert();
    });
    return () => media.revert();
  }, []);
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
          <a href="#shop" onClick={() => setMenu(false)}>
            فروشگاه
          </a>
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
        <section
          id="delster"
          className="showcase-hero"
          aria-labelledby="hero-heading"
        >
          <div className="hero-eyebrow">
            <span>نوشیدنی مالت بدون الکل</span>
            <span className="hero-rule" />
            <span dir="ltr">ORIGINAL TASTE</span>
          </div>
          <h1 id="hero-heading" className="hero-display" dir="ltr">
            DELSTER
          </h1>
          <ShowcaseStage hero />
          <div className="hero-foot">
            <div>
              <p>تنها دلستر، دلستر است.</p>
              <span>طعم آشنا، در انتخاب‌های متفاوت.</span>
            </div>
            <a className="button dark" href="#shop">
              انتخاب و خرید <ShoppingBag size={18} />
            </a>
            <a className="explore-link" href="#dadli">
              <span>کشف طعم‌ها</span>
              <ChevronDown size={18} />
            </a>
          </div>
          <span className="hero-side-note" dir="ltr">
            MALT. FRUIT. FRESHNESS.
          </span>
        </section>
        <section className="editorial" aria-labelledby="editorial-heading">
          <span className="small-label">از مالت تا میوه</span>
          <h2 id="editorial-heading">
            <span className="editorial-line">طعم آشنا.</span>
            <br />
            <span className="editorial-line editorial-highlight">
              انتخاب‌های تازه.
            </span>
          </h2>
          <p className="editorial-line">
            دلستر با طعم مالت؛ دادلی با طعم میوه.
            <br />
            برای هر سلیقه، یک انتخاب.
          </p>
        </section>
        <DadliExperience />
        <section
          className="cold-world"
          id="cold"
          aria-labelledby="cold-heading"
        >
          <img
            className="ice-landscape"
            src="/assets/showcase/antarctic-v1.webp"
            alt=""
            width={1536}
            height={1024}
            loading="lazy"
          />
          <div className="cold-copy">
            <span className="small-label">
              <Snowflake size={18} /> بهترین همراهِ خنکی
            </span>
            <h2 id="cold-heading">خنک بنوشید.</h2>
            <p>طعم دلستر، کنار چند تکه یخ.</p>
          </div>
          <div className="cold-products">
            <img
              className="cold-bottle cold-left"
              src="/assets/classic-v1.webp"
              alt="دلستر کلاسیک شیشه‌ای"
              width={900}
              height={1000}
              loading="lazy"
            />
            <img
              className="cold-bottle cold-center"
              src={posterUrl("bottle-tropical")}
              alt="دلستر استوایی شیشه‌ای"
              width={800}
              height={1000}
              loading="lazy"
            />
            <img
              className="cold-bottle cold-right"
              src="/assets/classic-v1.webp"
              alt=""
              width={900}
              height={1000}
              loading="lazy"
            />
          </div>
          <img
            className="ice-foreground"
            src="/assets/showcase/antarctic-v1.webp"
            alt=""
            width={1536}
            height={1024}
            loading="lazy"
          />
          <div className="cold-bottom">
            <span dir="ltr">SERVE CHILLED</span>
            <a href="#shop" className="button frost">
              انتخاب دلستر
            </a>
            <span>دلستر · شیشه‌ای</span>
          </div>
        </section>
        <section
          className="shop-section"
          id="shop"
          aria-labelledby="shop-heading"
        >
          <div className="shop-heading">
            <div>
              <span className="small-label">انتخاب شما</span>
              <h2 id="shop-heading">طعم دلخواهتان.</h2>
            </div>
            <button className="text-button" onClick={() => setCartOpen(true)}>
              مشاهده سبد خرید <ShoppingBag size={17} />
            </button>
          </div>
          <div className="shop-layout">
            <div className={`shop-product-visual ${asset}`}>
              <span className="shop-product-word" dir="ltr">
                {asset === "classic" ? "CLASSIC" : "TROPICAL"}
              </span>
              <img
                key={asset}
                src={
                  asset === "classic"
                    ? "/assets/classic-v1.webp"
                    : posterUrl("can-tropical")
                }
                alt={asset === "classic" ? "دلستر کلاسیک" : "دلستر استوایی"}
                width={800}
                height={1000}
                loading="lazy"
              />
            </div>
            <div className="shop-details">
              <div className="shop-tabs" role="group" aria-label="انتخاب دلستر">
                <button
                  aria-pressed={asset === "tropical"}
                  onClick={() => setAsset("tropical")}
                >
                  استوایی
                </button>
                <button
                  aria-pressed={asset === "classic"}
                  onClick={() => setAsset("classic")}
                >
                  کلاسیک
                </button>
              </div>
              <span className="small-label">نوشیدنی مالت بدون الکل</span>
              <h3>
                {product?.name ??
                  (asset === "classic" ? "دلستر کلاسیک" : "دلستر استوایی")}
              </h3>
              <p className="shop-description">
                {asset === "classic"
                  ? "طعم اصیل مالت، آشنا و ماندگار."
                  : "مالت با حال‌وهوای میوه‌های استوایی."}
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
                    : "محصولات در حال حاضر در دسترس نیستند."}
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
                فروشگاه نمایشی است؛ پرداخت واقعی انجام نمی‌شود.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="showcase-footer">
        <div className="footer-top">
          <a className="delster-wordmark" href="#delster" dir="ltr">
            DELSTER<span>®</span>
          </a>
          <p>تنها دلستر، دلستر است.</p>
          <a href="#delster">بازگشت به بالا</a>
        </div>
        <div className="footer-bottom">
          <div>
            <a href="#dadli">دادلی</a>
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
