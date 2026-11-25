"use client";

import { useState } from "react";
import { Leaf, Sparkles, Zap } from "lucide-react";
import type { BrandExperience as Experience } from "@/lib/brand-experiences";
import { BrandProductStage } from "./brand-product-stage";
import { BrandProductSelector } from "./brand-product-selector";
import { BrandTransitionEffects } from "./brand-transition-effects";
import { BrandHeader } from "./brand-header";
import { BrandPurchase } from "./brand-purchase";

export function BrandExperience({ brand }: { brand: Experience }) {
  const [selected, setSelected] = useState(0);
  const [revision, setRevision] = useState(0);
  const select = (index: number) => {
    if (index === selected) return;
    setSelected(index);
    setRevision((n) => n + 1);
  };
  const product = brand.products[selected];
  const vitamin = brand.slug === "vitamin-c";
  const aloe = brand.slug === "aloe";
  const race = brand.slug === "synergy";
  const Icon = aloe ? Leaf : vitamin ? Sparkles : Zap;
  return (
    <main id="main" className={`campaign campaign--${brand.slug}`}>
      {!vitamin && !aloe && (
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
      <BrandHeader slug={brand.slug} />
      <section className="campaign-scene" aria-labelledby="campaign-title">
        <div className="campaign-copy">
          <span className="campaign-eyebrow">
            <Icon size={17} aria-hidden="true" />
            {brand.detail}
          </span>
          <h1 id="campaign-title">
            {brand.name}
            <span dir="ltr">{brand.latin}</span>
          </h1>
          <div className="campaign-product-info" aria-live="polite">
            <span>{product.packaging}</span>
            <span>{product.volume} میلی‌لیتر</span>
            {vitamin && <span dir="ltr">C + B</span>}
          </div>
          <BrandPurchase key={product.id} sourceId={product.id} />
        </div>
        <div className="campaign-art">
          {aloe && (
            <div className="aloe-garden" aria-hidden="true">
              <img src="/assets/campaigns/aloe-world.webp" alt="" />
              <span className="aloe-garden-ring" />
            </div>
          )}
          {vitamin && (
            <div className="vitamin-sun" aria-hidden="true">
              <span>C</span>
              <i />
              <i />
              <i />
            </div>
          )}
          {race && (
            <div className="race-scene" aria-hidden="true">
              <div className="race-grid" />
              <div className="race-apex" />
              <span className="race-start-lights">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="race-finish" />
            </div>
          )}
          <BrandTransitionEffects brand={brand.slug} revision={revision} />
          <BrandProductStage
            products={brand.products}
            product={product}
            brand={brand.slug}
          />
          {vitamin && (
            <div className="vitamin-volume">
              <b>۲۴۰</b>
              <span>میلی‌لیتر</span>
            </div>
          )}
        </div>
      </section>
      <footer className="campaign-footer">
        <div className="campaign-selection">
          <span className="campaign-select-label">
            {vitamin ? "نوشیدنی گازدار" : "انتخاب محصول"}
          </span>
          <BrandProductSelector
            brand={brand}
            selected={selected}
            onSelect={select}
          />
        </div>
        <span className="campaign-footer-brand" dir="ltr" aria-hidden="true">
          {brand.latin}
        </span>
      </footer>
    </main>
  );
}
