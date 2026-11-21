import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import os from "node:os";
const b = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox",
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader",
  ],
});
const report = {
  environment: {
    browser: b.version(),
    cpu: os.cpus()[0].model,
    cores: os.cpus().length,
    renderer: "SwiftShader software GPU",
    network: "localhost, unthrottled",
    mode: "Next production",
    date: "2026-11-21",
  },
  runs: [],
};
for (const [name, width, height] of [
  ["desktop", 1440, 1000],
  ["mobile", 390, 844],
]) {
  const context = await b.newContext({ viewport: { width, height } });
  const p = await context.newPage();
  await p.addInitScript(() => {
    window.__metrics = { lcp: 0, cls: 0, interactions: [] };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__metrics.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        if (!e.hadRecentInput) window.__metrics.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        if (e.interactionId) window.__metrics.interactions.push(e.duration);
    }).observe({ type: "event", buffered: true, durationThreshold: 16 });
  });
  await p.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  await p.waitForFunction(
    () => document.querySelector(".product-stage")?.dataset.ready === "true",
  );
  await p.waitForTimeout(1000);
  await p.getByRole("button", { name: "باز کردن سبد خرید" }).click();
  await p.keyboard.press("Escape");
  const frames = await p.evaluate(
    () =>
      new Promise((resolve) => {
        let last = performance.now();
        const values = [];
        const start = last;
        function tick(now) {
          values.push(now - last);
          last = now;
          window.scrollTo(0, ((now - start) / 4000) * 2200);
          if (now - start < 4000) requestAnimationFrame(tick);
          else resolve(values);
        }
        requestAnimationFrame(tick);
      }),
  );
  const data = await p.evaluate(() => ({
    ...window.__metrics,
    resources: performance
      .getEntriesByType("resource")
      .map((e) => ({
        name: new URL(e.name).pathname,
        bytes: e.transferSize,
        duration: e.duration,
      })),
  }));
  const sorted = frames.slice(5).sort((a, b) => a - b);
  report.runs.push({
    name,
    viewport: `${width}x${height}`,
    lcpMs: data.lcp,
    cls: data.cls,
    interactionMaxMs: Math.max(0, ...data.interactions),
    rafMedianMs: sorted[Math.floor(sorted.length * 0.5)],
    rafP95Ms: sorted[Math.floor(sorted.length * 0.95)],
    rafOver33ms: sorted.filter((v) => v > 33.4).length,
    frameCount: sorted.length,
    resources: data.resources,
  });
  await context.close();
}
await b.close();
await writeFile(
  "docs/performance-measurements.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      ...report,
      runs: report.runs.map(({ resources, ...r }) => ({
        ...r,
        totalTransferredBytes: resources.reduce((s, e) => s + e.bytes, 0),
      })),
    },
    null,
    2,
  ),
);
