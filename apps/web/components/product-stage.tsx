"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Pose } from "./product-canvas";
const ProductCanvas = dynamic(() => import("./product-canvas"), { ssr: false });
export function ProductStage({ asset }: { asset: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const pose = useRef<Pose>({ rotation: 0, tilt: -0.16, y: 0, scale: 1 });
  const [enabled, setEnabled] = useState(false);
  const [loadedAsset, setLoadedAsset] = useState("");
  const ready = loadedAsset === asset;
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setLoadedAsset(asset), [asset]);
  const onError = useCallback(() => {
    setFailed(true);
    setEnabled(false);
  }, []);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        mobile: "(max-width: 700px)",
        desktop: "(min-width: 701px)",
      },
      (context) => {
        if (!context.conditions?.motion) {
          setEnabled(false);
          return;
        }
        const canvas = document.createElement("canvas");
        let supported = false;
        try {
          const gl = canvas.getContext("webgl2");
          supported = !!gl;
          gl?.getExtension("WEBGL_lose_context")?.loseContext();
        } catch {}
        setEnabled(supported);
        const mobile = !!context.conditions?.mobile;
        const render = () => {
          if (!document.hidden) pose.current.invalidate?.();
        };
        const intro = gsap.fromTo(
          pose.current,
          { y: -0.12 },
          {
            y: 0.1,
            duration: 2.4,
            yoyo: true,
            repeat: 1,
            ease: "sine.inOut",
            onUpdate: render,
          },
        );
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: "#story",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.8,
          },
          onUpdate: render,
        });
        timeline
          .to(
            pose.current,
            {
              rotation: Math.PI * 1.8,
              tilt: 0.24,
              scale: mobile ? 0.9 : 0.85,
              duration: 1,
              ease: "none",
            },
            0,
          )
          .to(
            stage.current,
            { xPercent: mobile ? 0 : 85, duration: 1, ease: "power1.inOut" },
            0,
          )
          .to(
            pose.current,
            {
              rotation: Math.PI * 2,
              tilt: -0.13,
              scale: mobile ? 0.78 : 0.92,
              duration: 1,
            },
            1,
          )
          .to(stage.current, { xPercent: mobile ? 0 : -12, duration: 1 }, 1)
          .to(
            pose.current,
            {
              rotation: Math.PI * 2 + 0.15,
              tilt: 0.08,
              scale: mobile ? 0.72 : 0.9,
              duration: 1,
            },
            2,
          )
          .to(stage.current, { xPercent: mobile ? 0 : 85, duration: 1 }, 2);
        const onVisibility = () => {
          if (document.hidden) intro.pause();
          else {
            intro.resume();
            render();
          }
        };
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
          timeline.kill();
          intro.kill();
          document.removeEventListener("visibilitychange", onVisibility);
          setEnabled(false);
        };
      },
    );
    return () => media.revert();
  }, []);
  return (
    <div className="stage-track" aria-hidden="true">
      <div className="product-stage" ref={stage} data-ready={ready && !failed}>
        <div className="product-halo" />
        <img
          className={`product-poster ${ready && !failed ? "is-hidden" : ""}`}
          src={`/assets/${asset}-v1.webp`}
          alt=""
          width="900"
          height="1000"
          fetchPriority="high"
        />
        {enabled && !failed && (
          <div className="canvas-wrap">
            <ProductCanvas
              asset={asset}
              pose={pose}
              onReady={onReady}
              onError={onError}
            />
          </div>
        )}
        <div className="product-shadow" />
      </div>
    </div>
  );
}
