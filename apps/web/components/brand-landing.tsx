"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Menu, X, ArrowDown, ArrowUpLeft } from "lucide-react";
import { ShowcaseStage } from "./showcase-stage";
import { BrandMark, BrandFooter } from "./brand-shell";
import { BrandNews } from "./brand-news";
import { Bubbles } from "./brand-bubbles";
import { ProductUniverse } from "./product-universe";
import { brands } from "@/lib/brand-content";
import { useHomeBackground } from "./use-home-background";
export default function BrandLanding() {
  const root = useRef<HTMLDivElement>(null),
    progress = useRef(0);
  const [menu, setMenu] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  useHomeBackground(root);
  useEffect(() => {
    let last = window.scrollY;
    let accumulated = 0;
    const onScroll = () => {
      const next = Math.max(0, window.scrollY);
      const delta = next - last;
      accumulated =
        Math.sign(delta) === Math.sign(accumulated)
          ? accumulated + delta
          : delta;
      if (next < 80 || accumulated < -12) setHeaderVisible(true);
      else if (accumulated > 24) setHeaderVisible(false);
      last = next;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        document.querySelector<HTMLButtonElement>(".brand-menu")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".brand-hero",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.75,
          },
        });
        tl.to(progress, { current: 1, duration: 0.76, ease: "none" }, 0)
          .to(".opening-copy", { autoAlpha: 0, y: -55, duration: 0.2 }, 0.06)
          .to(
            ".opening-seal",
            { scale: 0.7, autoAlpha: 0, duration: 0.23 },
            0.08,
          )
          .fromTo(
            ".gather-line",
            { autoAlpha: 0, y: 40 },
            { autoAlpha: 1, y: 0, stagger: 0.09, duration: 0.12 },
            0.55,
          );
        // Hold the completed composition; the sticky surface leaves with normal scrolling.
        tl.to({}, { duration: 0.2 }, 0.8);
        gsap.from(".cap-link", {
          y: 90,
          opacity: 0,
          rotation: -20,
          stagger: 0.1,
          scrollTrigger: {
            trigger: ".cap-grid",
            start: "top 85%",
            end: "top 45%",
            scrub: 0.7,
          },
        });
        gsap.from(".heritage-products img", {
          x: (i) => -160 - i * 65,
          opacity: 0,
          rotation: 0,
          stagger: 0.16,
          duration: 1.5,
          ease: "power1.out",
          scrollTrigger: {
            trigger: ".heritage",
            start: "top 80%",
            end: "bottom 75%",
            scrub: 1.4,
          },
        });
        gsap.utils
          .toArray<HTMLElement>(".scroll-write:not(.universe-statement)")
          .forEach((el) => {
            gsap.fromTo(
              el,
              { "--ink": "0%" },
              {
                "--ink": "100%",
                ease: "none",
                scrollTrigger: {
                  trigger: el,
                  start: "top 85%",
                  end: "top 40%",
                  scrub: 0.7,
                },
              },
            );
          });
      }, root);
      return () => {
        ctx.revert();
        progress.current = 0;
      };
    });
    return () => media.revert();
  }, []);
  return (
    <div ref={root} className="brand-site brand-homepage">
      <header
        className={`brand-header${headerVisible || menu ? "" : " is-hidden"}`}
      >
        <Link href="/" className="brand-home" aria-label="بهنوش، خانه">
          <BrandMark />
        </Link>
        <nav
          id="brand-nav"
          className={menu ? "open" : ""}
          aria-label="ناوبری اصلی"
        >
          <a onClick={() => setMenu(false)} href="#brands">
            خانواده بهنوش
          </a>
          <a onClick={() => setMenu(false)} href="#heritage">
            داستان ما
          </a>
          <a onClick={() => setMenu(false)} href="#news">
            اخبار بهنوش
          </a>
          <a onClick={() => setMenu(false)} href="#contact">
            ارتباط با ما
          </a>
        </nav>
        <Link className="brand-shop" href="/products">
          کشف محصولات <ArrowUpLeft size={17} />
        </Link>
        <button
          className="brand-menu"
          aria-label="فهرست"
          aria-expanded={menu}
          aria-controls="brand-nav"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main id="main">
        <div className="opening-world">
          <Bubbles />
          <section className="brand-hero" aria-labelledby="brand-title">
            <div className="brand-hero-surface">
              <div className="opening-seal">
                <BrandMark className="hero-emblem" />
              </div>
              <div className="opening-copy">
                <h1 id="brand-title">بهنوش</h1>
                <p>نوشیدنی برای سلیقه‌های متفاوت</p>
              </div>
              <ShowcaseStage hero progress={progress} />
              <div className="gather-copy">
                <h2>
                  <span className="gather-line">از مالت تا میوه.</span>
                  <span className="gather-line">طعم‌های متفاوت.</span>
                  <span className="gather-line">انتخاب با شما.</span>
                </h2>
              </div>
              <div className="hero-bottom">
                <a href="#products-world">
                  کشف دنیای بهنوش <ArrowDown size={16} />
                </a>
              </div>
            </div>
          </section>
          <div className="sky-world">
            <ProductUniverse />
            <section
              id="brands"
              className="brand-families"
              aria-labelledby="families-title"
            >
              <div className="brand-reveal">
                <h2 id="families-title" className="scroll-write">
                  بر‌ندهای خاص ما
                </h2>
              </div>
              <div className="cap-grid">
                {brands.map((b, i) => (
                  <Link
                    className="cap-link"
                    key={b.slug}
                    href={`/brands/${b.slug}`}
                    style={{ "--delay": `${-i * 1.3}s` } as CSSProperties}
                  >
                    <img
                      src={`/assets/brand/${b.slug}.png`}
                      alt={`ورود به دنیای ${b.name}`}
                      width="250"
                      height="250"
                      loading="lazy"
                    />
                    <h3>{b.name}</h3>
                    <span>{b.caption} ↖</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
        <section
          id="heritage"
          className="heritage"
          aria-labelledby="heritage-title"
        >
          <div className="heritage-products">
            <span className="heritage-year" aria-hidden="true">
              ۶۰
            </span>
            {["121", "122", "123", "124"].map((id, i) => (
              <img
                key={id}
                src={`/assets/catalog/${id}-v1.webp`}
                alt={`مالشعیر بهنوش ${i % 2 ? "لیمو" : "کلاسیک"} ${i < 2 ? "شیشه" : "پت"}`}
                loading="lazy"
              />
            ))}
            <span className="heritage-caption">
              چهار انتخاب آشنا. شصت سال خاطره
            </span>
          </div>
          <div className="heritage-copy brand-reveal">
            <h2 id="heritage-title" className="scroll-write">
              بهنوش، ۶۰ سال کیفیت،
              <br />
              طعم خاطره و همراهی
            </h2>
            <p>
              بعضی نام‌ها فراتر از یک برند، بخشی از خاطرات نسل‌ها می‌شوند. بهنوش
              با شش دهه تجربه، اصالت و نوآوری، جایگاهی ماندگار در صنعت نوشیدنی
              ایران ساخته است.
            </p>
            <p>
              داستان بهنوش، داستان شصت سال تلاش برای خلق سبدی متنوع از محصولات
              نوشیدنی است؛ محصولاتی که با بهره‌گیری از دانش، فناوری و تجربه،
              برای پاسخ‌گویی به سلیقه‌ها و نیازهای گوناگون مصرف‌کنندگان تولید
              می‌شوند.
            </p>
            <p>
              از لحظه‌های ساده روزمره تا دورهمی‌ها و جشن‌های خاطره‌انگیز، بهنوش
              در کنار نسل‌های مختلف ایرانی بوده و امروز با تکیه بر میراث ارزشمند
              گذشته، توسعه محصولات و نوآوری، مسیر خود را به سوی آینده ادامه
              می‌دهد.
            </p>
            <strong>بهنوش؛ ۶۰ سال تجربه، یک دنیا طعم، یک عمر خاطره</strong>
          </div>
        </section>
        <BrandNews />
      </main>
      <BrandFooter />
    </div>
  );
}
