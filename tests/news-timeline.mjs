import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

await mkdir("test-results", { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox",
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader",
  ],
});
const base = process.env.APP_ORIGIN || "http://127.0.0.1:3000";
const errors = [];
try {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    const news = page.locator("#news");
    await expect(news).toHaveAttribute("data-scroll-timeline", "true");
    await expect(
      page.getByText("داستان ادامه دارد.", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /خبر قبلی|خبر بعدی/ }),
    ).toHaveCount(0);
    const dates = page.locator(".news-date-rail button");
    expect(
      await dates.nth(0).evaluate((el) => el.getBoundingClientRect().x),
    ).toBeLessThan(
      await dates.nth(1).evaluate((el) => el.getBoundingClientRect().x),
    );
    const position = async (progress) => {
      await news.evaluate((section, progress) => {
        const panel = section.querySelector(".news-story-panel");
        const top = parseFloat(getComputedStyle(panel).top);
        const travel = section.offsetHeight - panel.offsetHeight;
        window.scrollTo({
          top:
            window.scrollY +
            section.getBoundingClientRect().top -
            top +
            travel * progress,
          behavior: "instant",
        });
      }, progress);
      await expect
        .poll(() =>
          news.evaluate((el) =>
            Number(el.style.getPropertyValue("--news-progress")),
          ),
        )
        .toBeCloseTo(progress, 2);
    };
    await position(0);
    await expect(dates.nth(0)).toHaveAttribute("aria-current", "step");
    const start = await page.locator(".news-story-panel").boundingBox();
    await position(0.4);
    const middle = await page.locator(".news-story-panel").boundingBox();
    expect(Math.abs(start.y - middle.y)).toBeLessThan(2);
    await expect(dates.nth(2)).toHaveAttribute("aria-current", "step");
    expect(
      await page
        .locator(".news-story-viewport")
        .evaluate((el) => el.scrollLeft / el.clientWidth),
    ).toBeCloseTo(2, 2);
    const line = await page
      .locator(".news-date-line > span")
      .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
    expect(line).toBeCloseTo(0.4, 2);
    expect(
      await page
        .locator(".news-date-line > span")
        .evaluate((el) => getComputedStyle(el).transformOrigin.split(" ")[0]),
    ).toBe("0px");
    const frame = await page.locator(".news-story-viewport").boundingBox();
    expect(frame.x).toBeCloseTo(0, 0);
    expect(frame.width).toBeCloseTo(viewport.width, 0);
    const activeDate = await dates.nth(2).boundingBox();
    expect(activeDate.x).toBeGreaterThanOrEqual(0);
    expect(activeDate.x + activeDate.width).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: `test-results/news-${viewport.width}.png` });
    await dates.nth(3).click();
    await expect(dates.nth(3)).toHaveAttribute("aria-current", "step");
    await expect
      .poll(() =>
        page
          .locator(".news-story-viewport")
          .evaluate((el) => el.scrollLeft / el.clientWidth),
      )
      .toBeCloseTo(3, 2);
    await position(1);
    await expect(dates.nth(5)).toHaveAttribute("aria-current", "step");
    await page.evaluate(() =>
      window.scrollBy({ top: 250, behavior: "instant" }),
    );
    await expect
      .poll(
        async () => (await page.locator(".news-story-panel").boundingBox()).y,
      )
      .toBeLessThan(start.y - 200);
    await position(0.2);
    await expect(dates.nth(1)).toHaveAttribute("aria-current", "step");
    await dates.nth(2).click();
    await expect
      .poll(() =>
        page
          .locator(".news-story-viewport")
          .evaluate((el) => el.scrollLeft / el.clientWidth),
      )
      .toBeCloseTo(2, 2);
    await page.locator(".news-story-viewport").focus();
    await page.keyboard.press("ArrowLeft");
    await expect
      .poll(() =>
        page
          .locator(".news-story-viewport")
          .evaluate((el) => el.scrollLeft / el.clientWidth),
      )
      .toBeCloseTo(3, 2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height - 180,
    });
    await expect
      .poll(() =>
        news.evaluate((section) => {
          const panel = section.querySelector(".news-story-panel");
          const slides = section.querySelector(".news-story-viewport");
          const expected =
            panel.offsetHeight +
            Math.max(slides.clientWidth, innerHeight * 0.75) * 5;
          return Math.abs(
            parseFloat(section.style.getPropertyValue("--news-height")) -
              expected,
          );
        }),
      )
      .toBeLessThan(1);
    await position(0.8);
    await expect(dates.nth(4)).toHaveAttribute("aria-current", "step");
    console.log(
      `PASS ${viewport.width}px: pinned slides, right-to-left slides, left-to-right dates, edge-to-edge viewport, date navigation, reverse, release, keyboard, resize`,
    );
    await page.close();
  }
  const reduced = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await reduced.goto(base);
  await expect(reduced.locator("#news")).toHaveAttribute(
    "data-scroll-timeline",
    "false",
  );
  await reduced.locator(".news-date-rail button").nth(1).click();
  await expect(
    reduced.locator(".news-date-rail button").nth(1),
  ).toHaveAttribute("aria-current", "step");
  expect(
    await reduced
      .locator(".news-story-panel")
      .evaluate((el) => getComputedStyle(el).position),
  ).toBe("relative");
  console.log("PASS reduced motion: native carousel without pinning");
  expect(errors).toEqual([]);
} finally {
  await browser.close();
}
