"use client";
import { useEffect, useRef, type CSSProperties } from "react";
export function Bubbles() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let visible = false;
    const update = () =>
      el.classList.toggle("bubbles-running", visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return (
    <div ref={root} className="ambient-bubbles" aria-hidden="true">
      {Array.from({ length: 64 }, (_, i) => {
        const depth = i % 4;
        return (
          <i
            key={i}
            data-depth={depth}
            style={
              {
                "--x": `${(i * 37 + 7) % 100}%`,
                "--size": `${4 + depth * 9 + (i % 7)}px`,
                "--delay": `${-i * 0.71}s`,
                "--duration": `${7 - depth * 1.15 + (i % 3) * 0.3}s`,
                "--sway": `${(i % 2 ? 1 : -1) * (16 + depth * 12)}px`,
                "--alpha": 0.22 + depth * 0.2,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
