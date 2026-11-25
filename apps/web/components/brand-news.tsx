"use client";
import { useRef, useState } from "react";
import { news } from "@/lib/brand-content";

export function BrandNews() {
  const viewport = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const go = (index: number) => {
    const el = viewport.current;
    if (!el) return;
    el.scrollTo({
      left: index * el.clientWidth,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  return (
    <section id="news" className="news-story" aria-labelledby="news-title">
      <header className="news-story-heading">
        <div>
          <p>تازه‌های خانواده بهنوش</p>
          <h2 id="news-title">داستان ادامه دارد.</h2>
        </div>
        <div className="news-controls">
          <button
            onClick={() => go(active - 1)}
            disabled={active === 0}
            aria-label="خبر قبلی"
          >
            قبلی
          </button>
          <button
            onClick={() => go(active + 1)}
            disabled={active === news.length - 1}
            aria-label="خبر بعدی"
          >
            بعدی
          </button>
        </div>
      </header>
      <div
        className="news-story-viewport"
        ref={viewport}
        tabIndex={0}
        role="region"
        aria-label="اخبار؛ برای مرور به راست بکشید"
        onScroll={(e) =>
          setActive(
            Math.round(
              e.currentTarget.scrollLeft / e.currentTarget.clientWidth,
            ),
          )
        }
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
                onFocus={() => go(i)}
              >
                متن کامل خبر
              </a>
            </div>
          </article>
        ))}
      </div>
      <nav className="news-date-rail" aria-label="خط زمانی اخبار">
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
      <svg
        className="news-wave"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 60 C120 -20 180 -20 300 60 S480 140 600 60 S780 -20 900 60 S1080 140 1200 60 S1380 -20 1440 60 V120 H0Z" />
      </svg>
    </section>
  );
}
