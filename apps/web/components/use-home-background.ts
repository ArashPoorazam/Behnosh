"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

const chapters = [
  [".brand-hero", "--home-cream"],
  [".product-universe", "--home-mint"],
  [".brand-families", "--home-blue"],
  [".heritage", "--home-apricot"],
  [".news-story", "--home-sage"],
] as const;

export function useHomeBackground(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const canvas = root.current;
    if (!canvas) return;
    const styles = getComputedStyle(canvas);
    const sections = chapters.map(([selector, token]) => ({
      element: canvas.querySelector<HTMLElement>(selector)!,
      color: styles.getPropertyValue(token).trim(),
    }));
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      let color = sections[0].color;
      if (!motion.matches) {
        const maxScroll = document.documentElement.scrollHeight - innerHeight;
        for (let i = 1; i < sections.length; i++) {
          const section = sections[i];
          const top = section.element.getBoundingClientRect().top + scrollY;
          const start = Math.max(0, top - innerHeight * 0.9);
          // Clamp the transition to the available scroll range on short layouts.
          const end = Math.min(maxScroll, top - innerHeight * 0.2);
          if (scrollY <= start) break;
          const progress = Math.min(
            1,
            (scrollY - start) / Math.max(1, end - start),
          );
          const eased = progress * progress * (3 - 2 * progress);
          color = gsap.utils.interpolate(color, section.color, eased);
        }
      }
      canvas.style.setProperty("--home-background", color);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(canvas);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
      canvas.style.removeProperty("--home-background");
    };
  }, [root]);
}
