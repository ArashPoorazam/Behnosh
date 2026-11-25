import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.APP_ORIGIN || "http://127.0.0.1:3000";
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const check = (message) => console.log("PASS", message);
try {
  await page.goto(`${base}/products`, { waitUntil: "networkidle" });
  await expect(page.locator(".shelf-grid")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(
    page.locator('.shelf-results-toolbar [role="status"]'),
  ).toContainText("۱۰۷");
  await expect(page.locator(".shelf-card")).toHaveCount(24);
  await expect(page.locator(".shelf-add").first()).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/catalog-desktop.png",
    fullPage: false,
  });
  check("107 products, live offers, first 24 cards, no desktop overflow");
  const search = page.getByRole("searchbox", { name: "جست‌وجوی محصولات" });
  await search.fill("كلاسيك ۳۲۰");
  await expect(page.locator(".shelf-card").first()).toContainText("کلاسیک");
  expect(await page.locator(".shelf-card").count()).toBeGreaterThan(0);
  check("Arabic/Persian keyboard variants and Persian digits match");
  await search.fill("چیزی‌که‌وجودندارد");
  await expect(page.getByText("این طعم را پیدا نکردیم.")).toBeVisible();
  await page
    .getByRole("button", { name: "نمایش همه محصولات", exact: true })
    .click();
  await expect(search).toBeFocused();
  await page
    .getByRole("combobox", { name: "دسته‌بندی‌ها", exact: true })
    .selectOption("دوغ");
  await expect(page.locator(".shelf-card")).toHaveCount(4);
  await page.getByLabel("نوع بسته‌بندی", { exact: true }).selectOption("پت");
  const cards = await page.locator(".shelf-specs").allTextContents();
  expect(cards.every((text) => text.includes("پت"))).toBeTruthy();
  await page.getByRole("button", { name: "پاک کردن فیلترها" }).click();
  await page.getByLabel("برند دلخواهت").selectOption("دادلی");
  await expect(page.locator(".shelf-card")).toHaveCount(13);
  await page.getByLabel("فقط موجودها").check();
  await expect(page.locator(".shelf-card")).toHaveCount(13);
  await page.getByLabel("مرتب‌سازی").selectOption("price-up");
  const prices = await page.locator(".shelf-price strong").allTextContents();
  const numeric = prices.map((text) =>
    Number(
      text
        .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
        .replace(/[^0-9]/g, ""),
    ),
  );
  expect(numeric).toEqual([...numeric].sort((a, b) => a - b));
  check(
    "category, packaging, brand, availability, price sort and empty-state recovery",
  );
  await page.getByRole("button", { name: "پاک کردن فیلترها" }).click();
  const importedCard = page.locator('[data-source-id="118"]');
  const add = importedCard.getByRole("button", { name: /افزودن/ });
  await add.click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText("دلستر شیشه لیمویی");
  const rect = await drawer.boundingBox();
  expect(rect.x).toBe(0);
  await drawer.getByRole("button", { name: /^افزایش/ }).click();
  await expect(drawer.locator("output")).toHaveText("۲");
  await drawer.getByRole("button", { name: /^کاهش/ }).click();
  await expect(drawer.locator("output")).toHaveText("۱");
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(add).toBeFocused();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "باز کردن سبد خرید" }).click();
  await expect(drawer).toContainText("دلستر شیشه لیمویی");
  await page.screenshot({ path: "test-results/catalog-cart-desktop.png" });
  await drawer.getByRole("button", { name: /^حذف/ }).click();
  await expect(drawer).toContainText("سبد خرید شما خالی است.");
  await page.keyboard.press("Escape");
  check(
    "imported product adds to left drawer, quantity updates, Escape/focus, persistence and removal",
  );
  // Existing multi-pack offers remain selectable and use authoritative totals.
  const classic = page.locator('[data-source-id="152"]');
  await classic.getByRole("combobox").selectOption({ label: "بسته ۶ عددی" });
  await classic.getByRole("button", { name: /افزودن/ }).click();
  await expect(drawer).toContainText("بسته ۶ عددی");
  await expect(drawer).toContainText("۲۲۲٬۰۰۰");
  await drawer.getByRole("button", { name: /^حذف/ }).click();
  await page.keyboard.press("Escape");
  while (
    await page.getByRole("button", { name: "دیدن طعم‌های بیشتر" }).count()
  ) {
    await page.getByRole("button", { name: "دیدن طعم‌های بیشتر" }).click();
  }
  await expect(page.locator(".shelf-card")).toHaveCount(107);
  // Explicitly load all lazy images to verify every original product photo.
  await page.locator(".shelf-card img").evaluateAll((images) =>
    images.forEach((img) => {
      img.loading = "eager";
    }),
  );
  await expect
    .poll(() =>
      page
        .locator(".shelf-card img")
        .evaluateAll(
          (images) =>
            images.filter((img) => img.complete && img.naturalWidth > 0).length,
        ),
    )
    .toBe(107);
  check(
    "existing six-pack pricing, all 107 cards reachable, all 107 photos load",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(
    page.getByRole("button", { name: /دسته‌بندی و فیلتر/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/catalog-mobile.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: /دسته‌بندی و فیلتر/ }).click();
  await page.getByLabel("برند دلخواهت").selectOption("آب آشامیدنی");
  await expect(page.locator(".shelf-card")).toHaveCount(2);
  await page.getByRole("button", { name: /دسته‌بندی و فیلتر/ }).click();
  await page.locator(".shelf-add").first().click();
  await expect(drawer).toBeVisible();
  expect((await drawer.boundingBox()).width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/catalog-cart-mobile.png" });
  await drawer.getByRole("button", { name: /^حذف/ }).click();
  await page.keyboard.press("Escape");
  check("mobile filters, responsive cards and full-width cart drawer");
  // Recoverable service failure leaves the source catalog available to browse.
  await page.route("**/api/v1/catalog", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "unavailable",
          message: "ارتباط با فروشگاه برقرار نشد.",
        },
      }),
    }),
  );
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".shelf-error[role=alert]")).toContainText(
    "ارتباط با فروشگاه",
  );
  await expect(page.locator(".shelf-card")).toHaveCount(24);
  await expect(page.locator(".shelf-add").first()).toBeDisabled();
  await page.unroute("**/api/v1/catalog");
  await page.getByRole("button", { name: "تلاش دوباره", exact: true }).click();
  await expect(page.locator(".shelf-add").first()).toBeEnabled();
  check(
    "API failure is visible, unsafe adds disabled, retry restores live offers",
  );
  expect(errors).toEqual([]);
  check("no browser runtime errors");
} finally {
  await browser.close();
}
