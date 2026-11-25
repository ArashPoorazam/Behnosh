"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown, ShoppingBag } from "lucide-react";
import { ShowcaseStage } from "./showcase-stage";

/** Reveal whole shaped lines from right to left: splitting Persian letters breaks joining. */
export function ScriptLine({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={`script-line ${className}`}>
      <span className="script-guide" aria-hidden="true">
        {children}
      </span>
      <span className="script-ink">{children}</span>
    </span>
  );
}

export function ScrollHero() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.7,
          },
        });
        timeline
          .to(progress, { current: 1, duration: 1, ease: "none" }, 0)
          .to(".hero-display", { y: -80, autoAlpha: 0, duration: 0.23 }, 0.02)
          .to(
            ".hero-eyebrow, .hero-foot",
            { autoAlpha: 0, duration: 0.13 },
            0.02,
          )
          .fromTo(
            ".hero-orbit-copy",
            { autoAlpha: 0, y: 35 },
            { autoAlpha: 1, y: 0, duration: 0.18 },
            0.31,
          )
          .fromTo(
            ".hero-orbit-copy .script-ink",
            { clipPath: "inset(0 0 0 100%)" },
            {
              clipPath: "inset(0 0 0 0%)",
              stagger: 0.14,
              duration: 0.2,
              ease: "none",
            },
            0.36,
          )
          .to(
            ".hero-sticky",
            { backgroundColor: "#f8d8c7", duration: 0.65 },
            0.3,
          )
          .to(".orbit-progress i", { scaleX: 1, duration: 1, ease: "none" }, 0);
      }, root);
      return () => {
        ctx.revert();
        progress.current = 0;
      };
    });
    return () => media.revert();
  }, []);
  return (
    <section
      ref={root}
      id="delster"
      className="scroll-hero"
      aria-labelledby="hero-heading"
    >
      <div className="hero-sticky">
        <div className="hero-eyebrow">
          <span>نوشیدنی مالت بدون الکل</span>
          <span className="hero-rule" />
          <span dir="ltr">A LITTLE EXTRA FRESH</span>
        </div>
        <h1 id="hero-heading" className="hero-display" dir="ltr">
          DELSTER
        </h1>
        <ShowcaseStage hero progress={progress} />
        <div className="hero-orbit-copy">
          <span className="small-label">دورِ هم، خوش‌طعم‌تر</span>
          <h2>
            <ScriptLine>یک دنیا طعم،</ScriptLine>
            <ScriptLine>در مدارِ تو</ScriptLine>
          </h2>
          <a href="#shop" className="orbit-shop-link">
            طعم خودت را پیدا کن
          </a>
        </div>
        <div className="hero-foot">
          <div>
            <p>تنها دلستر، دلستر است</p>
            <span>یک جرعه آشنا. یک حس تازه</span>
          </div>
          <a className="button dark" href="#shop">
            انتخاب و خرید <ShoppingBag size={18} />
          </a>
          <a className="explore-link" href="#flavor-story">
            اسکرول کن؛ طعم‌ها در حرکت‌اند <ChevronDown size={18} />
          </a>
        </div>
        <div className="orbit-progress" aria-hidden="true">
          <i />
        </div>
      </div>
    </section>
  );
}

export function FlavorStory() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".editorial .script-ink",
          { clipPath: "inset(0 0 0 100%)" },
          {
            clipPath: "inset(0 0 0 0%)",
            stagger: 0.6,
            ease: "none",
            scrollTrigger: {
              trigger: ".editorial",
              start: "top 75%",
              end: "bottom 70%",
              scrub: 0.5,
            },
          },
        );
        const mobile = window.matchMedia("(max-width: 700px)").matches;
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".flavor-journey",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.8,
          },
        });
        // Each chapter holds for a full reading interval before the can travels.
        const left = mobile ? -22 : -75;
        const right = mobile ? 22 : 75;
        tl.set(".journey-can", { xPercent: left, rotation: -12 })
          .to(
            ".journey-can",
            {
              xPercent: right,
              rotation: 12,
              duration: 0.65,
              ease: "power2.inOut",
            },
            1.3,
          )
          .to(
            ".journey-sticky",
            { backgroundColor: "#f4b5ae", duration: 0.65 },
            1.3,
          )
          .to(
            ".journey-panel-0",
            { autoAlpha: 0, y: -20, duration: 0.22 },
            1.28,
          )
          .fromTo(
            ".journey-panel-1",
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 0.25 },
            1.8,
          )
          .to(
            ".journey-can",
            {
              xPercent: left,
              rotation: -10,
              duration: 0.65,
              ease: "power2.inOut",
            },
            3.3,
          )
          .to(
            ".journey-sticky",
            { backgroundColor: "#c8e8c5", duration: 0.65 },
            3.3,
          )
          .to(
            ".journey-panel-1",
            { autoAlpha: 0, y: -20, duration: 0.22 },
            3.28,
          )
          .fromTo(
            ".journey-panel-2",
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 0.25 },
            3.8,
          )
          .to({}, { duration: 1.4 }, 4.05);
        [0, 1, 2].forEach((i) =>
          tl.fromTo(
            `.journey-panel-${i} .script-ink`,
            { clipPath: "inset(0 0 0 100%)" },
            { clipPath: "inset(0 0 0 0%)", duration: 0.25 },
            [0, 1.85, 3.85][i],
          ),
        );
      }, root);
      return () => ctx.revert();
    });
    return () => media.revert();
  }, []);
  return (
    <div ref={root} id="flavor-story">
      <section className="editorial" aria-labelledby="editorial-heading">
        <div className="editorial-kicker">
          <span className="small-label">ریشه در خاطره، رو به تازگی</span>
          <span dir="ltr">FAMILIAR. YET UNEXPECTED</span>
        </div>
        <h2 id="editorial-heading">
          <ScriptLine>طعم آشنا</ScriptLine>
          <ScriptLine className="editorial-fresh">انتخاب‌های تازه</ScriptLine>
        </h2>
        <div className="editorial-bottom">
          <span className="editorial-seal" aria-hidden="true">
            مالت
            <br />
            <b>×</b>
            <br />
            میوه
          </span>
          <p>
            بعضی طعم‌ها خاطره‌اند
            <br />
            بعضی‌ها، شروع یک حال خوب تازه
            <br />
            <strong>اینجا هر دو را پیدا می‌کنی</strong>
          </p>
          <a href="#dadli">از دلستر تا دنیای دادلی</a>
        </div>
      </section>
      <section className="flavor-journey" aria-label="سفر طعم دلستر">
        <div className="journey-sticky">
          <span className="journey-watermark" aria-hidden="true" dir="ltr">
            GOOD TASTE
          </span>
          <div className="journey-can">
            <ShowcaseStage asset="can-tropical" />
          </div>
          {[
            [
              "از یک طعم آشنا",
              "اصالت، جرعه‌جرعه",
              "طعم مالت، همان همراه آشنای لحظه‌های ساده. سر میز، کنار دوستان، وسط یک گفت‌وگوی خوب.",
            ],
            [
              "تا یک حال‌وهوای تازه",
              "کمی میوه. کلی تازگی",
              "از لیموی سرزنده تا هلوی دلنشین؛ هر بار، دری به یک حس تازه باز کن.",
            ],
            [
              "و یک انتخاب برای تو",
              "به سلیقهٔ خودت",
              "قوطی یا شیشه‌ای، مالت یا میوه‌ای. طعم محبوبت را پیدا کن و جمع خودت را بساز.",
            ],
          ].map(([label, title, copy], i) => (
            <div className={`journey-panel journey-panel-${i}`} key={title}>
              <span className="small-label">{label}</span>
              <h2>
                <ScriptLine>{title}</ScriptLine>
              </h2>
              <p>{copy}</p>
              {i === 2 && (
                <a className="button dark" href="#shop">
                  کشف همهٔ محصولات
                </a>
              )}
            </div>
          ))}
          <span className="journey-caption">دلستر استوایی · ۳۳۰ میلی‌لیتر</span>
        </div>
      </section>
    </div>
  );
}
