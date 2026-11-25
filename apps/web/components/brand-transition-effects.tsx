import type { CSSProperties } from "react";

export function BrandTransitionEffects({
  brand,
  revision,
}: {
  brand: string;
  revision: number;
}) {
  return (
    <div
      key={revision}
      className={`brand-transition brand-transition--${brand}${revision ? " is-changing" : ""}`}
      aria-hidden="true"
    >
      {Array.from({ length: brand === "synergy" ? 5 : 9 }, (_, i) => (
        <i key={i} style={{ "--particle": i } as CSSProperties} />
      ))}
      <span className="brand-transition-ring" />
    </div>
  );
}
