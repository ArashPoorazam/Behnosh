"use client";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { discoveryProducts } from "@/lib/discovery-products";
export function ProductUniverse() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });
        tl.to({}, { duration: 1 });
        gsap.utils
          .toArray<HTMLElement>(".product-bubble", root.current)
          .forEach((el, i) => {
            const start = 0.025 + i * 0.075;
            // Constant-size, constant-speed passage; only fade beyond the viewport.
            tl.fromTo(
              el,
              { y: "85vh", autoAlpha: 0 },
              { y: "-90vh", duration: 0.31, ease: "none" },
              start,
            )
              .to(el, { autoAlpha: 1, duration: 0.015 }, start)
              .to(el, { autoAlpha: 0, duration: 0.015 }, start + 0.31);
          });
        gsap.utils
          .toArray<HTMLElement>(".universe-statement", root.current)
          .forEach((el, i) => {
            const at = 0.06 + i * 0.3;
            tl.fromTo(
              el,
              { autoAlpha: 0, y: 50, "--ink": "0%" },
              { autoAlpha: 1, y: 0, "--ink": "100%", duration: 0.12 },
              at,
            ).to(el, { autoAlpha: 0, y: -40, duration: 0.08 }, at + 0.22);
          });
      }, root);
      return () => ctx.revert();
    });
    return () => media.revert();
  }, []);
  return (
    <section
      id="products-world"
      ref={root}
      className="product-universe"
      aria-label="دنیای محصولات بهنوش"
    >
      <div className="universe-stage">
        <div className="universe-statements">
          {["یک دنیا طعم.", "برای هر سلیقه.", "همراهِ لحظه‌ها."].map((text) => (
            <h2 className="universe-statement scroll-write" key={text}>
              {text}
            </h2>
          ))}
        </div>
        <div className="product-bubbles">
          {discoveryProducts.map((p, i) => (
            <Link
              key={p.id}
              className={`product-bubble bubble-${i}`}
              aria-label={`کشف ${p.name}`}
              href={`/products?${new URLSearchParams({ brand: p.brand, category: p.category, packaging: p.packaging, q: p.q })}`}
              style={
                {
                  "--bubble-left": `${[14, 65, 36, 74, 8, 48, 22, 68, 40][i]}%`,
                  "--bubble-size": `${[18, 15, 17, 14, 19, 16, 14, 18, 17][i]}vw`,
                  "--float-delay": `${-i * 0.9}s`,
                } as CSSProperties
              }
            >
              <div>
                <img
                  src={`/assets/catalog/${p.id}-v1.webp`}
                  alt={p.name}
                  loading="lazy"
                />
                <span>{p.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
