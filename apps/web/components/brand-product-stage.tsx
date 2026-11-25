"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { Rotate3D } from "lucide-react";
import type { BrandProduct } from "@/lib/brand-experiences";
import type { BrandPose } from "./brand-product-canvas";

const BrandProductCanvas = dynamic(() => import("./brand-product-canvas"), {
  ssr: false,
});

export function BrandProductStage({
  products,
  product,
  brand,
  spin,
  onSpin,
}: {
  products: BrandProduct[];
  product: BrandProduct;
  brand: string;
  spin: number;
  onSpin: () => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [active, setActive] = useState(true);
  const pose = useRef<BrandPose>({ turn: 0, tilt: 0, dragging: false });
  const lastSpin = useRef(spin);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => {
    setFailed(true);
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(media.matches);
    const visibility = () => setActive(!document.hidden);
    motion();
    visibility();
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    try {
      const probe = document.createElement("canvas");
      const gl = probe.getContext("webgl2");
      setEnabled(!!gl);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      setEnabled(false);
    }
    return () => {
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    pose.current.turn = 0;
    pose.current.tilt = 0;
  }, [product.id]);
  useEffect(() => {
    if (spin !== lastSpin.current && !reduced) pose.current.turn += Math.PI * 2;
    lastSpin.current = spin;
    pose.current.invalidate?.();
  }, [spin, reduced]);
  const stop = (e: PointerEvent<HTMLDivElement>) => {
    if (pointer.current?.id !== e.pointerId) return;
    pointer.current = null;
    pose.current.dragging = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const live = enabled && ready && !failed;
  return (
    <div
      className="campaign-product product-stage-3d"
      data-ready={live}
      data-product={product.id}
    >
      <div
        className="brand-model-surface"
        tabIndex={live ? 0 : undefined}
        role="group"
        aria-label={`${product.label}؛ مدل سه‌بعدی. برای چرخاندن بکشید یا از کلیدهای چپ و راست استفاده کنید.`}
        onPointerDown={(e) => {
          if (!live || e.button !== 0) return;
          pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          pose.current.dragging = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const last = pointer.current;
          if (!last || last.id !== e.pointerId) return;
          pose.current.turn += (e.clientX - last.x) * 0.012;
          pose.current.tilt = Math.max(
            -0.35,
            Math.min(0.35, pose.current.tilt + (e.clientY - last.y) * 0.003),
          );
          pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          pose.current.invalidate?.();
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={() => {
          pointer.current = null;
          pose.current.dragging = false;
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            pose.current.turn += e.key === "ArrowLeft" ? -0.35 : 0.35;
            pose.current.invalidate?.();
          } else if (e.key === "Home") {
            e.preventDefault();
            pose.current.turn = 0;
            pose.current.tilt = 0;
            pose.current.invalidate?.();
          }
        }}
      >
        <img
          className="brand-model-poster"
          src={`/assets/catalog/${product.id}-v1.webp`}
          alt={`${product.packaging} ${product.volume} میلی‌لیتر`}
          draggable={false}
          aria-hidden={live}
        />
        {enabled && !failed && (
          <div className="brand-model-canvas" aria-hidden="true">
            <BrandProductCanvas
              products={products}
              selected={product.id}
              brand={brand}
              pose={pose}
              spin={spin}
              reduced={reduced}
              active={active}
              onReady={onReady}
              onError={onError}
            />
          </div>
        )}
      </div>
      {live && (
        <button
          className="brand-spin"
          type="button"
          onClick={onSpin}
          aria-label="چرخاندن محصول"
        >
          <Rotate3D size={17} />
          <span>بچرخون</span>
        </button>
      )}
    </div>
  );
}
