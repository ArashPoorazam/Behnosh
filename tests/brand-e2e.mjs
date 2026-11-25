import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.APP_ORIGIN || "http://127.0.0.1:3000";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
const brands = {
  aloe: ["127", "128"],
  start: ["242", "243", "241", "145"],
  "vitamin-c": ["143"],
  synergy: ["141", "160", "140", "142"],
};
await mkdir("test-results", { recursive: true });
const page = await browser.newPage({ reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    for (const [slug, ids] of Object.entries(brands)) {
      await page.goto(`${base}/brands/${slug}`, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: "nextjs-portal { display: none; }" });
      const stage = page.locator(".product-stage-3d");
      await expect(stage).toHaveAttribute("data-ready", "true", {
        timeout: 30000,
      });
      await expect(stage.locator("canvas")).toBeVisible();
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        clipped: [...document.querySelectorAll(".campaign a, .campaign button")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return (
              r.width > 0 &&
              (r.left < -1 ||
                r.right > innerWidth + 1 ||
                r.top < -1 ||
                r.bottom > document.documentElement.scrollHeight + 1)
            );
          })
          .map((el) => el.textContent),
      }));
      expect(layout, `${slug}: ${viewport.width}x${viewport.height}`).toEqual({
        overflow: false,
        clipped: [],
      });
      await expect(page.locator(".campaign-header img")).toHaveCount(0);
      await expect(page.getByText("بچرخون", { exact: true })).toHaveCount(0);
      await expect(page.locator(".brand-add")).toBeEnabled();
      await expect(page.locator(".campaign-header")).toHaveCSS(
        "height",
        viewport.width <= 700 ? "58px" : "64px",
      );
      const choices = page.locator(".brand-choice");
      for (let i = 0; i < (await choices.count()); i++) {
        await choices.nth(i).click();
        await expect(stage).toHaveAttribute("data-product", ids[i]);
        await expect(page.locator(".brand-purchase")).toHaveAttribute(
          "data-source",
          `catalog-${ids[i]}`,
        );
        await expect(choices.nth(i)).toHaveAttribute("aria-pressed", "true");
      }
      if (ids.length > 1) {
        await choices.first().focus();
        await page.keyboard.press("End");
        await expect(choices.last()).toBeFocused();
        await page.keyboard.press("Home");
        await expect(choices.first()).toBeFocused();
        await expect(stage).toHaveAttribute("data-product", ids[0]);
      }
      await page.screenshot({
        path: `test-results/brand-3d-${slug}-${viewport.width}.png`,
        fullPage: true,
      });
      console.log(
        `PASS ${slug} ${viewport.width}x${viewport.height}: 3D, selection, keyboard, viewport`,
      );
    }
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/brands/start`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal { display: none; }" });
  await expect(page.locator(".product-stage-3d")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 30000 },
  );
  const surface = page.locator(".brand-model-surface");
  const canvas = surface.locator("canvas");
  const before = await canvas.screenshot();
  await surface.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(100);
  expect(
    (await canvas.screenshot()).equals(before),
    "Keyboard rotates real canvas pixels",
  ).toBe(false);
  const turned = await canvas.screenshot();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  expect(
    (await canvas.screenshot()).equals(turned),
    "Drag rotates the model",
  ).toBe(false);
  await page.keyboard.press("Home");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const slug of Object.keys(brands)) {
    await page.goto(`${base}/brands/${slug}`, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "nextjs-portal { display: none; }" });
    await expect(page.locator(".product-stage-3d")).toHaveAttribute(
      "data-ready",
      "true",
      { timeout: 30000 },
    );
    if (slug !== "vitamin-c") {
      const choices = page.locator(".brand-choice");
      for (let i = 0; i < 7; i++)
        await choices.nth(i % (await choices.count())).click();
      await choices.last().click();
      await expect(page.locator(".product-stage-3d")).toHaveAttribute(
        "data-product",
        brands[slug].at(-1),
      );
    }
    if (slug !== "vitamin-c") {
      const effect = page.locator(".brand-transition.is-changing i").first();
      expect(
        await effect.evaluate((el) => getComputedStyle(el).animationName),
      ).not.toBe("none");
    }
    await expect(page.locator(".brand-model-canvas canvas")).toHaveCount(1);
    console.log(`PASS ${slug}: distinct motion and rapid interactions`);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".brand-transition")).toBeHidden();

  // Every brand can purchase its selected SKU through the shared cart.
  for (const slug of [...Object.keys(brands), "dadali"]) {
    await page.goto(`${base}/brands/${slug}`, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "nextjs-portal { display: none; }" });
    await expect(page.locator(".brand-add")).toBeEnabled();
    if (slug === "dadali") {
      const tabs = page.getByRole("tab");
      for (let i = 0; i < (await tabs.count()); i++) {
        await tabs.nth(i).click();
        await expect(page.locator(".brand-add")).toBeEnabled();
      }
      await tabs.first().click();
      await page.locator(".brand-pack-options label").last().click();
    }
    await page
      .getByRole("button", { name: "افزایش تعداد", exact: true })
      .click();
    const responsePromise = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/v1/cart/items") &&
        r.request().method() === "PUT",
    );
    await page.locator(".brand-add").click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    const basket = await response.json();
    const mutation = response.request().postDataJSON();
    expect(
      basket.items.find((item) => item.variant_id === mutation.variant_id)
        .quantity,
    ).toBe(2);
    await expect(page.locator(".brand-add")).toHaveText("به سبد اضافه شد");
    await page
      .getByRole("button", { name: "باز کردن سبد خرید", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator(".cart-items li")).toHaveCount(
      basket.items.length,
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".campaign-cart b")).not.toHaveText("۰");
    console.log(
      `PASS ${slug}: real cart API, selected pack, quantity, drawer, persistence`,
    );
  }
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(`${base}/brands/dadali`, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "nextjs-portal { display: none; }" });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(".campaign-header img")).toHaveCount(0);
    await page.getByRole("tab").last().click();
    await expect(page.locator(".brand-purchase")).toHaveAttribute(
      "data-source",
      "catalog-196",
    );
    await page.screenshot({
      path: `test-results/brand-dadali-${viewport.width}.png`,
      fullPage: true,
    });
  }

  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === "webgl2" || type === "webgl") return null;
      return getContext.call(this, type, ...args);
    };
  });
  await fallback.goto(`${base}/brands/aloe`, { waitUntil: "networkidle" });
  await expect(fallback.locator(".product-stage-3d")).toHaveAttribute(
    "data-ready",
    "false",
  );
  await expect(fallback.locator(".brand-model-poster")).toHaveCSS(
    "opacity",
    "1",
  );
  await fallback.locator(".brand-choice").last().click();
  await expect(fallback.locator(".brand-model-poster")).toHaveAttribute(
    "src",
    "/assets/catalog/128-v1.webp",
  );
  await fallback.close();
  expect(errors).toEqual([]);
  console.log(
    "PASS real rotation, reduced motion, WebGL fallback, no runtime errors",
  );
} finally {
  await browser.close();
}
