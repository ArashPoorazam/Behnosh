"use client";
import {
  useState,
  useRef,
  useEffect,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { dadliFlavors, posterUrl } from "@/lib/showcase";
import { ShowcaseStage } from "./showcase-stage";
export function DadliExperience() {
  const section = useRef<HTMLElement>(null);
  const wipe = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const animations = useRef(new Set<Animation>());
  const selectedRef = useRef(0);
  const [selected, setSelected] = useState(0);
  const flavor = dadliFlavors[selected];
  useEffect(
    () => () => {
      animations.current.forEach((a) => a.cancel());
      animations.current.clear();
    },
    [],
  );
  const select = (next: number) => {
    if (next === selectedRef.current) return;
    selectedRef.current = next;
    const el = section.current;
    const surface = wipe.current;
    if (el && surface) {
      const layer = document.createElement("div");
      layer.className = "flavor-color-layer";
      surface.appendChild(layer);
      layer.style.backgroundColor = dadliFlavors[next].color;
      const rect = el.getBoundingClientRect();
      const button = document
        .getElementById(`flavor-tab-${next}`)
        ?.getBoundingClientRect();
      const x = button
        ? button.left + button.width / 2 - rect.left
        : rect.width / 2;
      const y = button
        ? button.top + button.height / 2 - rect.top
        : rect.height / 2;
      const radius = Math.hypot(
        Math.max(x, rect.width - x),
        Math.max(y, rect.height - y),
      );
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const currentAnimation = layer.animate(
        [
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          { clipPath: `circle(${radius}px at ${x}px ${y}px)` },
        ],
        {
          duration: reduced ? 0 : 850,
          easing: "cubic-bezier(.22,1,.36,1)",
          fill: "forwards",
        },
      );
      animation.current = currentAnimation;
      animations.current.add(currentAnimation);
      currentAnimation.onfinish = () => {
        if (animation.current !== currentAnimation) return;
        el.style.backgroundColor = dadliFlavors[next].color;
        animations.current.forEach((a) => a.cancel());
        animations.current.clear();
        surface.replaceChildren();
      };
    }
    setSelected(next);
  };
  const selectWithKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let next = index;
    if (event.key === "ArrowLeft") next = (index + 1) % dadliFlavors.length;
    else if (event.key === "ArrowRight")
      next = (index - 1 + dadliFlavors.length) % dadliFlavors.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = dadliFlavors.length - 1;
    else return;
    event.preventDefault();
    select(next);
    document.getElementById(`flavor-tab-${next}`)?.focus();
  };
  return (
    <section
      ref={section}
      id="dadli"
      className="dadli-experience"
      style={
        {
          "--flavor-bg": flavor.color,
          "--flavor-ink": flavor.ink,
          "--flavor-accent": flavor.accent,
        } as CSSProperties
      }
      aria-labelledby="dadli-title"
    >
      <div ref={wipe} className="flavor-color-wipe" aria-hidden="true" />
      <div className="section-top">
        <span>نوشیدنی گازدار میوه‌ای</span>
        <span className="latin-label" dir="ltr">
          A TASTE OF DADLI
        </span>
      </div>
      <div className="dadli-layout">
        <div className="dadli-intro">
          <span className="small-label">دنیای دادلی</span>
          <h2 id="dadli-title">
            رنگِ تازه،
            <br />
            طعمِ تازه.
          </h2>
          <p>
            هر رنگ، یک طعم.
            <br />
            انتخاب کنید و از نزدیک بشناسید.
          </p>
          <span className="volume-label">
            ۲۵۰ میلی‌لیتر <i /> شیشه‌ای
          </span>
        </div>
        <div className="dadli-visual">
          <span className="dadli-ghost" aria-hidden="true" dir="ltr">
            DADLI
          </span>
          <div className="flavor-orbit" />
          <ShowcaseStage asset={`dadli-${flavor.id}`} fruit={flavor.fruit} />
        </div>
        <div
          className="tasting-panel"
          role="tabpanel"
          id="flavor-panel"
          aria-labelledby={`flavor-tab-${selected}`}
          tabIndex={0}
        >
          <div key={flavor.id} className="tasting-content">
            <span className="latin-label" dir="ltr">
              {flavor.latin}
            </span>
            <h3>{flavor.name}</h3>
            <p>{flavor.description}</p>
            <div className="taste-notes">
              {flavor.notes.map((note, i) => (
                <span key={note} style={{ animationDelay: `${i * 80}ms` }}>
                  {note}
                </span>
              ))}
            </div>
            <div className="taste-profile">
              {["شیرینی", "ترشی", "طراوت"].map((name, i) => (
                <div key={name}>
                  <span>{name}</span>
                  <span className="taste-track">
                    <i style={{ width: `${flavor.profile[i]}%` }} />
                  </span>
                </div>
              ))}
            </div>
            <small className="showcase-note">
              ترکیب طعم‌ها برای نمایش و تصویرسازی است.
            </small>
          </div>
        </div>
      </div>
      <div
        className="flavor-selector"
        role="tablist"
        aria-label="انتخاب طعم دادلی"
      >
        {dadliFlavors.map((f, i) => (
          <button
            key={f.id}
            id={`flavor-tab-${i}`}
            role="tab"
            aria-selected={i === selected}
            aria-controls="flavor-panel"
            tabIndex={i === selected ? 0 : -1}
            onClick={() => select(i)}
            onKeyDown={(e) => selectWithKeyboard(e, i)}
          >
            <img
              src={posterUrl(`dadli-${f.id}`)}
              alt=""
              loading="lazy"
              width={48}
              height={60}
            />
            <span>{f.name}</span>
            <i style={{ background: f.accent }} />
          </button>
        ))}
      </div>
    </section>
  );
}
