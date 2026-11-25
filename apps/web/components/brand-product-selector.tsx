"use client";

import { Leaf } from "lucide-react";
import type { CSSProperties, KeyboardEvent } from "react";
import type { BrandExperience } from "@/lib/brand-experiences";

export function BrandProductSelector({
  brand,
  selected,
  onSelect,
}: {
  brand: BrandExperience;
  selected: number;
  onSelect: (index: number) => void;
}) {
  const keyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowLeft") next = (index + 1) % brand.products.length;
    else if (event.key === "ArrowRight")
      next = (index - 1 + brand.products.length) % brand.products.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = brand.products.length - 1;
    else return;
    event.preventDefault();
    onSelect(next);
    document.getElementById(`brand-choice-${next}`)?.focus();
  };
  if (brand.products.length === 1)
    return (
      <span className="vitamin-single-label">
        شیشه‌ای · حاوی ویتامین C و گروه B
      </span>
    );
  return (
    <div
      className={`brand-selector brand-selector--${brand.slug}`}
      role="group"
      aria-label={`انتخاب بسته‌بندی ${brand.name}`}
      style={
        {
          "--choice": selected,
          "--choices": brand.products.length,
        } as CSSProperties
      }
    >
      {brand.slug === "synergy" && (
        <span className="race-selector-track" aria-hidden="true" />
      )}
      {brand.products.map((item, index) => (
        <button
          id={`brand-choice-${index}`}
          className="brand-choice"
          key={item.id}
          type="button"
          aria-pressed={selected === index}
          aria-label={item.label}
          onClick={() => onSelect(index)}
          onKeyDown={(e) => keyboard(e, index)}
        >
          {brand.slug === "aloe" ? (
            <>
              <Leaf size={22} aria-hidden="true" />
              <span>{item.label}</span>
              <i aria-hidden="true" />
            </>
          ) : brand.slug === "start" ? (
            <>
              <span className="start-coin">
                <img
                  src={`/assets/catalog/${item.id}-v1.webp`}
                  alt=""
                  draggable={false}
                />
              </span>
              <span className="choice-label">{item.label}</span>
            </>
          ) : (
            <>
              <span className="race-dial">
                <b>{index < 2 ? item.volume : index === 2 ? "شیشه" : "۱ L"}</b>
                <i aria-hidden="true" />
              </span>
              <span className="choice-label">{item.label}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}
