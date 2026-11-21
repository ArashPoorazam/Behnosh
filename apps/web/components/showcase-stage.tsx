"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  heroProducts,
  posterUrl,
  type FruitKind,
  type SceneProduct,
} from "@/lib/showcase";
const ShowcaseCanvas = dynamic(() => import("./showcase-canvas"), {
  ssr: false,
});
export function ShowcaseStage({
  asset,
  fruit,
  hero = false,
}: {
  asset?: string;
  fruit?: FruitKind;
  hero?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [failed, setFailed] = useState(false);
  const [readyKey, setReadyKey] = useState("");
  const [pageVisible, setPageVisible] = useState(true);
  const key = hero ? "hero" : (asset ?? "");
  const ready = readyKey === key;
  const onReady = useCallback(() => setReadyKey(key), [key]);
  const onError = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (media.matches) {
        setEnabled(false);
        return;
      }
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2");
      setEnabled(!!gl);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    };
    update();
    media.addEventListener("change", update);
    const observer = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { rootMargin: "150px" },
    );
    if (root.current) observer.observe(root.current);
    const visibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const products: SceneProduct[] = hero
    ? heroProducts
    : [
        {
          asset: asset!,
          position: [0, 0, 0],
          rotation: [0.02, -0.06, -0.11],
          scale: 1.13,
        },
      ];
  return (
    <div
      ref={root}
      className={`showcase-stage ${hero ? "hero-stage" : "dadli-stage"}`}
      aria-hidden="true"
      data-ready={ready && !failed}
    >
      <div
        className={`stage-posters ${ready && !failed && enabled ? "stage-posters-hidden" : ""}`}
      >
        {products.map((p, i) => (
          <img
            key={p.asset}
            src={posterUrl(p.asset)}
            alt=""
            className={`stage-poster poster-${i}`}
            width={800}
            height={1000}
            fetchPriority={hero ? "high" : undefined}
            loading={hero ? "eager" : "lazy"}
          />
        ))}
      </div>
      {enabled && !failed && visible && (
        <div className="showcase-webgl">
          <ShowcaseCanvas
            products={products}
            fruit={fruit}
            active={visible && pageVisible}
            onReady={onReady}
            onError={onError}
          />
        </div>
      )}
    </div>
  );
}
