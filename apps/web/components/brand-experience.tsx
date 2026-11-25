"use client";

import Link from "next/link";
import { useState } from "react";
import { Leaf, Sparkles, Zap } from "lucide-react";
import { brands } from "@/lib/brand-content";
import type { BrandExperience as Experience } from "@/lib/brand-experiences";
import { BrandProductStage } from "./brand-product-stage";
import { BrandProductSelector } from "./brand-product-selector";
import { BrandTransitionEffects } from "./brand-transition-effects";

export function BrandExperience({ brand }: { brand: Experience }) {
  const [selected, setSelected] = useState(0);
  const [revision, setRevision] = useState(0);
  const [spin, setSpin] = useState(0);
  const rotate = () => {
    setSpin((n) => n + 1);
    setRevision((n) => n + 1);
  };
  const select = (index: number) => {
    if (index === selected) {
      rotate();
      return;
    }
    setSelected(index);
    setRevision((n) => n + 1);
  };
  const product = brand.products[selected];
  const vitamin = brand.slug === "vitamin-c";
  const Icon = brand.slug === "aloe" ? Leaf : vitamin ? Sparkles : Zap;

  return (
    <main id="main" className={`campaign campaign--${brand.slug}`}>
      {!vitamin && (
        <picture className="campaign-backdrop" aria-hidden="true">
          <source
            media="(max-width: 700px)"
            srcSet={`/assets/campaigns/${brand.slug}-world-mobile.webp`}
          />
          <img
            src={`/assets/campaigns/${brand.slug}-world.webp`}
            alt=""
            fetchPriority="high"
          />
        </picture>
      )}
      <div className="campaign-wash" aria-hidden="true" />
      <header className="campaign-header">
        <Link
          href="/#brands"
          className="campaign-home"
          aria-label="بازگشت به خانواده بهنوش"
        >
          <img
            src="/assets/brand/behnoush-official.png"
            width="56"
            height="56"
            alt="بهنوش"
          />
          <span>خانواده بهنوش</span>
        </Link>
        <nav className="campaign-nav" aria-label="برندهای بهنوش">
          {brands.map((item) => (
            <Link
              key={item.slug}
              href={`/brands/${item.slug}`}
              aria-current={item.slug === brand.slug ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <span className="campaign-wordmark" dir="ltr">
          {brand.latin}
        </span>
      </header>

      <section className="campaign-scene" aria-labelledby="campaign-title">
        <div className="campaign-copy">
          <span className="campaign-eyebrow">
            <Icon size={17} aria-hidden="true" />
            {brand.eyebrow}
          </span>
          <h1 id="campaign-title">
            {brand.title[0]}
            <br />
            <em>{brand.title[1]}</em>
          </h1>
          <p>{brand.description}</p>
          {vitamin && (
            <div
              className="vitamin-formula"
              aria-label="حاوی ویتامین سی و ویتامین‌های گروه بی"
            >
              <span dir="ltr">C</span>
              <i aria-hidden="true">+</i>
              <span dir="ltr">B</span>
              <small>
                ویتامین‌ها
                <br />
                در یک شیشه
              </small>
            </div>
          )}
          <Link
            className="campaign-cta"
            href={`/products?brand=${encodeURIComponent(brand.name)}`}
          >
            {vitamin ? "کشف ویتامین سی" : `کشف محصولات ${brand.name}`}
            <span aria-hidden="true">+</span>
          </Link>
        </div>

        <div className="campaign-art">
          {vitamin ? (
            <>
              <span className="vitamin-big-c" aria-hidden="true">
                C
              </span>
              <span
                className="vitamin-orbit vitamin-orbit--one"
                aria-hidden="true"
              />
              <span
                className="vitamin-orbit vitamin-orbit--two"
                aria-hidden="true"
              />
              <span className="vitamin-stamp">
                <b dir="ltr">C + B</b>
                <span>یک ترکیب درخشان</span>
              </span>
            </>
          ) : (
            <span className="campaign-art-label" dir="ltr" aria-hidden="true">
              {brand.slug === "aloe"
                ? "NATURE IN PINK"
                : brand.slug === "start"
                  ? "UNLEASH YOUR NATURE"
                  : "ENERGY IN MOTION"}
            </span>
          )}
          <BrandTransitionEffects brand={brand.slug} revision={revision} />
          <BrandProductStage
            products={brand.products}
            product={product}
            brand={brand.slug}
            spin={spin}
            onSpin={rotate}
          />
          <div
            className="campaign-product-caption"
            aria-live="polite"
            aria-atomic="true"
          >
            <strong>{brand.name}</strong>
            <span>
              {product.packaging} <i /> {product.volume} میلی‌لیتر
            </span>
          </div>
        </div>
      </section>

      <footer className="campaign-footer">
        <div className="campaign-selection">
          <BrandProductSelector
            brand={brand}
            selected={selected}
            onSelect={select}
            onSpin={rotate}
          />
        </div>
        <span className="campaign-signature" dir="ltr">
          {brand.signature}
        </span>
        <span className="campaign-detail">{brand.detail}</span>
      </footer>
    </main>
  );
}
