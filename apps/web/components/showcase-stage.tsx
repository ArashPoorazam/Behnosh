"use client";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  heroProducts,
  dadliProducts,
  posterUrl,
  type FruitKind,
  type SceneProduct,
} from "@/lib/showcase";
import { orbitPose } from "@/lib/orbit";
const ShowcaseCanvas = dynamic(() => import("./showcase-canvas"), {
  ssr: false,
});
export function ShowcaseStage({
  asset,
  fruit,
  hero = false,
  progress,
}: {
  asset?: string;
  fruit?: FruitKind;
  hero?: boolean;
  progress?: RefObject<number>;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [visited, setVisited] = useState(false);
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [failed, setFailed] = useState(false);
  const [readyKey, setReadyKey] = useState("");
  const [pageVisible, setPageVisible] = useState(true);
  const dadli = !!asset?.startsWith("dadli-");
  const key = hero ? "hero" : dadli ? "dadli-collection" : (asset ?? "");
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
      ([e]) => {
        setVisible(e.isIntersecting);
        if (e.isIntersecting) setVisited(true);
      },
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
  useEffect(() => {
    if (!hero || !progress || (ready && enabled && !failed)) return;
    let frame = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const posters =
      root.current?.querySelectorAll<HTMLElement>(".stage-poster");
    let unit = 1;
    let aspect = 1;
    const measure = () => {
      const width = root.current?.clientWidth || 1;
      const height = root.current?.clientHeight || 1;
      aspect = width / height;
      unit =
        (height / (2 * 10.8 * Math.tan((17 * Math.PI) / 180))) *
        Math.min(1, aspect * 0.78);
      posters?.forEach((node) => {
        node.style.width = `${unit * 3.45 * 0.8}px`;
        node.style.height = `${unit * 3.45}px`;
      });
    };
    const resize = new ResizeObserver(measure);
    if (root.current) resize.observe(root.current);
    measure();
    const update = () => {
      const value = reduced.matches ? 0 : progress.current;
      posters?.forEach((node, i) => {
        const pose = orbitPose(
          i,
          value,
          reduced.matches ? 0 : performance.now() / 1000,
          aspect < 1.1,
        );
        // Mirror the camera perspective so the fallback also has front/back depth.
        const perspective = 10.8 / (10.8 - pose.z * Math.min(1, aspect * 0.78));
        node.style.transform = `translate(-50%, -50%) translate(${pose.x * unit * perspective}px, ${-pose.y * Math.max(1, 1 / aspect) * unit * perspective}px) rotate(${-pose.rotation * 57.3}deg) scale(${pose.scale * perspective})`;
        node.style.opacity = pose.visible ? "1" : "0";
        node.style.zIndex = String(Math.round((pose.z + 12) * 10));
      });
      if (!reduced.matches) frame = requestAnimationFrame(update);
    };
    if (visible && pageVisible) update();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
    };
  }, [hero, progress, visible, pageVisible, ready, enabled, failed]);
  const products: SceneProduct[] = hero
    ? heroProducts
    : dadli
      ? dadliProducts
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
            key={`${p.asset}-${i}`}
            src={posterUrl(p.asset)}
            alt=""
            className={`stage-poster poster-${i}`}
            style={dadli ? { opacity: p.asset === asset ? 1 : 0 } : undefined}
            width={800}
            height={1000}
            fetchPriority={hero && i < 2 ? "high" : undefined}
            loading={hero ? "eager" : "lazy"}
          />
        ))}
      </div>
      {enabled && !failed && visited && (
        <div className="showcase-webgl">
          <ShowcaseCanvas
            products={products}
            progress={progress}
            hero={hero}
            activeAsset={dadli ? asset : undefined}
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
