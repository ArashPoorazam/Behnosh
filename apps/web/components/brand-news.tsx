"use client";
import { useEffect, useRef, useState } from "react";
import { news } from "@/lib/brand-content";

export function BrandNews() {
  const section = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const navigate = useRef<(index: number) => void>(() => {});
  const [active, setActive] = useState(0);
  const go = (index: number) =>
    navigate.current(Math.max(0, Math.min(news.length - 1, index)));

  useEffect(() => {
    const container = section.current!;
    const surface = panel.current!;
    const slides = viewport.current!;
    const dates = rail.current!;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let travel = 0;
    let stickyTop = 0;

    const showProgress = (progress: number) => {
      container.style.setProperty("--news-progress", String(progress));
      dates.scrollLeft = progress * (dates.scrollWidth - dates.clientWidth);
      setActive(Math.round(progress * (news.length - 1)));
    };
    const update = () => {
      frame = 0;
      if (motion.matches) return;
      const progress = Math.max(
        0,
        Math.min(
          1,
          (stickyTop - container.getBoundingClientRect().top) / travel,
        ),
      );
      slides.scrollLeft = progress * (slides.scrollWidth - slides.clientWidth);
      showProgress(progress);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const measure = () => {
      travel =
        Math.max(slides.clientWidth, innerHeight * 0.75) * (news.length - 1);
      stickyTop = Math.min(0, innerHeight - surface.offsetHeight);
      container.dataset.scrollTimeline = String(!motion.matches);
      container.style.setProperty(
        "--news-height",
        `${surface.offsetHeight + travel}px`,
      );
      container.style.setProperty("--news-top", `${stickyTop}px`);
      if (motion.matches) {
        showProgress(
          slides.scrollLeft / (slides.scrollWidth - slides.clientWidth),
        );
      } else {
        schedule();
      }
    };
    const onSlideScroll = () => {
      if (motion.matches) {
        showProgress(
          slides.scrollLeft / (slides.scrollWidth - slides.clientWidth),
        );
      }
    };
    navigate.current = (index) => {
      if (motion.matches) {
        slides.scrollTo({
          left: index * slides.clientWidth,
          behavior: "instant",
        });
      } else {
        window.scrollTo({
          top:
            window.scrollY +
            container.getBoundingClientRect().top -
            stickyTop +
            (index / (news.length - 1)) * travel,
          behavior: "smooth",
        });
      }
    };
    const observer = new ResizeObserver(measure);
    observer.observe(surface);
    observer.observe(slides);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    motion.addEventListener("change", measure);
    slides.addEventListener("scroll", onSlideScroll, { passive: true });
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      motion.removeEventListener("change", measure);
      slides.removeEventListener("scroll", onSlideScroll);
      navigate.current = () => {};
    };
  }, []);
  return (
    <section
      ref={section}
      id="news"
      className="news-story"
      aria-labelledby="news-title"
    >
      <div ref={panel} className="news-story-panel">
        <header className="news-story-heading">
          <h2 id="news-title">تازه‌های بهنوش</h2>
          <span className="news-section-label">رویدادها · محصولات · خبرها</span>
        </header>
        <div
          className="news-story-viewport"
          ref={viewport}
          tabIndex={0}
          role="region"
          aria-label="اخبار؛ برای مرور به پایین پیمایش کنید"
          onKeyDown={(event) => {
            const index =
              event.key === "ArrowLeft"
                ? active + 1
                : event.key === "ArrowRight"
                  ? active - 1
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? news.length - 1
                      : null;
            if (index !== null) {
              event.preventDefault();
              go(index);
            }
          }}
        >
          {news.map((item, i) => (
            <article className="news-story-item" key={item.href} dir="rtl">
              <img
                src={item.image}
                alt={item.title}
                width={960}
                height={600}
                loading="lazy"
              />
              <div className="news-story-copy">
                <p className="news-date">{item.date}</p>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={active === i ? 0 : -1}
                >
                  متن کامل خبر
                </a>
              </div>
            </article>
          ))}
        </div>
        <div ref={rail} className="news-date-viewport">
          <nav className="news-date-rail" aria-label="خط زمانی اخبار">
            <span className="news-date-line" aria-hidden="true">
              <span />
            </span>
            {news.map((item, i) => (
              <button
                key={item.href}
                aria-current={active === i ? "step" : undefined}
                onClick={() => go(i)}
                aria-label={`نمایش خبر: ${item.title}`}
              >
                <span aria-hidden="true" />
                {item.date}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
