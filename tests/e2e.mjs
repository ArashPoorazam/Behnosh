import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.APP_ORIGIN || "http://127.0.0.1:3000";
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
const report = {
  environment: {
    browser: browser.version(),
    mode: process.env.TEST_MODE || "development",
    desktop: "1440x1000",
    mobile: "390x844",
    gpu: "SwiftShader software rendering",
  },
  checks: [],
  errors: [],
};
const check = (name) => {
  report.checks.push(name);
  console.log("PASS", name);
};
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
page.on("pageerror", (e) => report.errors.push(e.message));
try {
  await page.goto(base, { waitUntil: "networkidle" });
  await expect(page.locator(".product-stage")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await expect(page.getByRole("heading", { level: 1 })).toContainText("لحظه");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  check("desktop real model, semantic heading, no horizontal overflow");
  await page.screenshot({ path: "test-results/storefront-desktop.png" });
  await page.locator("#purchase").scrollIntoViewIfNeeded();
  await page.getByLabel("بسته ۶ عددی", { exact: true }).check();
  await page
    .getByRole("button", { name: "افزودن به سبد", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "به سبد اضافه شد" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "باز کردن سبد خرید" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("۲۵۲٬۰۰۰");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    await page
      .getByRole("button", { name: "باز کردن سبد خرید" })
      .evaluate((e) => document.activeElement === e),
  ).toBeTruthy();
  check(
    "pack selection, authoritative cart price, Escape closes dialog and restores focus",
  );
  await page.getByRole("button", { name: "باز کردن سبد خرید" }).click();
  await page.getByRole("button", { name: "ادامه و پرداخت نمایشی" }).click();
  await page.waitForURL("**/orders/*");
  await expect(
    page.getByRole("heading", { name: "پرداخت نمایشی", exact: true }),
  ).toBeVisible();
  const orderID = new URL(page.url()).pathname.split("/").pop();
  await page.getByRole("button", { name: "شبیه‌سازی پرداخت ناموفق" }).click();
  await expect(page.getByRole("status")).toContainText("ناموفق");
  await page.getByRole("button", { name: "پرداخت موفق نمایشی" }).click();
  await expect(page.locator(".status-badge")).toHaveText("پرداخت‌شده");
  await page.screenshot({ path: "test-results/order-success.png" });
  check("checkout → failed simulated payment → successful retry → paid order");
  await page.goto(base + "/admin");
  await page
    .getByLabel("نام کاربری", { exact: true })
    .fill(process.env.ADMIN_USERNAME || "admin");
  await page
    .getByLabel("گذرواژه", { exact: true })
    .fill(process.env.ADMIN_PASSWORD || "Behnosh-demo-2026!");
  await page.getByRole("button", { name: "ورود به مدیریت" }).click();
  await expect(
    page.getByRole("heading", { name: "موجودی انبارها" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "سفارش‌ها", exact: true }).click();
  const orderRow = page
    .getByRole("row")
    .filter({ hasText: orderID.slice(0, 8) });
  await expect(orderRow).toContainText("پرداخت‌شده");
  await orderRow.getByRole("button", { name: "شروع آماده‌سازی" }).click();
  await expect(orderRow).toContainText("در حال آماده‌سازی");
  await orderRow.getByRole("button", { name: "ثبت ارسال" }).click();
  await expect(orderRow).toContainText("ارسال‌شده");
  check("admin authentication and order fulfillment states");
  await page
    .getByRole("button", { name: "انبار و موجودی", exact: true })
    .click();
  const stockRow = page
    .getByRole("row")
    .filter({ hasText: "انبار تهران" })
    .filter({ hasText: "DL-TR-06" });
  await expect(stockRow).toContainText("۱۱۹");
  await stockRow.getByRole("button", { name: "اصلاح موجودی" }).click();
  await page.getByLabel("تغییر موجودی (عدد منفی برای خروج)").fill("1");
  await page
    .getByLabel("دلیل تغییر", { exact: true })
    .fill("بازگردانی موجودی پس از آزمون نمایشی");
  await page.getByRole("button", { name: "ثبت تغییر و سند انبار" }).click();
  await expect(stockRow).toContainText("۱۲۰");
  check("successful payment decrements stock, admin adjustment restores stock");
  await page
    .getByRole("button", { name: "گردش و رویدادها", exact: true })
    .click();
  await expect(
    page
      .getByRole("cell", {
        name: "بازگردانی موجودی پس از آزمون نمایشی",
        exact: true,
      })
      .first(),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/admin-history.png" });
  check("inventory movement and audit are visible");
  await page.getByRole("button", { name: "خروج", exact: true }).click();
  await expect(page.getByRole("heading", { name: "ورود مدیر" })).toBeVisible();
  await page.goto(base);
  await expect(page.locator(".product-stage")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  check("navigation away and back recreates the motion scene");
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mp = await mobile.newPage();
  mp.on("pageerror", (e) => report.errors.push(e.message));
  await mp.goto(base, { waitUntil: "networkidle" });
  expect(
    await mp.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await mp.screenshot({ path: "test-results/storefront-mobile.png" });
  await mp.locator("#flavors").scrollIntoViewIfNeeded();
  await mp.getByRole("button", { name: /ORIGINAL MALT/ }).click();
  await expect(mp.locator(".product-stage")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await mp.locator("#purchase").scrollIntoViewIfNeeded();
  await expect(
    mp.getByRole("heading", { name: "دلستر کلاسیک", exact: true }),
  ).toBeVisible();
  await mp.screenshot({ path: "test-results/purchase-mobile.png" });
  await mp.getByRole("button", { name: "افزودن به سبد", exact: true }).click();
  await mp.getByRole("button", { name: "باز کردن سبد خرید" }).click();
  await mp.getByRole("button", { name: "ادامه و پرداخت نمایشی" }).click();
  await mp.waitForURL("**/orders/*");
  await mp.getByRole("button", { name: "لغو سفارش و آزادسازی موجودی" }).click();
  await expect(mp.locator(".status-badge")).toHaveText("لغوشده");
  check("mobile variant, purchase, checkout and cancellation");
  await mobile.close();
  const reduced = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const rp = await reduced.newPage();
  await rp.goto(base, { waitUntil: "networkidle" });
  expect(await rp.locator("canvas").count()).toBe(0);
  await expect(rp.locator(".product-poster")).toBeVisible();
  await rp.screenshot({ path: "test-results/reduced-motion-mobile.png" });
  check("reduced motion uses static poster without a canvas");
  await reduced.close();
  const fallback = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const fp = await fallback.newPage();
  await fp.route("**/*.glb", (route) => route.abort());
  await fp.goto(base, { waitUntil: "networkidle" });
  await expect(fp.locator(".product-poster")).toBeVisible();
  expect(await fp.locator(".product-stage").getAttribute("data-ready")).toBe(
    "false",
  );
  await fp.screenshot({ path: "test-results/model-fallback.png" });
  check("failed 3D download preserves poster and shopping controls");
  await fallback.close();
  expect(report.errors).toEqual([]);
  check(
    "no uncaught browser errors in working shopping/admin/navigation flows",
  );
} catch (e) {
  report.failure = e.stack;
  console.error(e);
  await page.screenshot({ path: "test-results/failure.png" });
  process.exitCode = 1;
} finally {
  await writeFile(
    "test-results/e2e-report.json",
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
