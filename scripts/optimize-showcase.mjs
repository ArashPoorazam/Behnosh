import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, weld, textureCompress } from "@gltf-transform/functions";
import sharp from "sharp";
import { readFile, mkdir, stat, writeFile } from "node:fs/promises";
const products = JSON.parse(
  await readFile("scripts/showcase-products.json", "utf8"),
);
const out = "apps/web/public/assets/showcase";
await mkdir(out, { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const report = [];
const requested = process.env.BEVERAGE_PRODUCT_IDS?.split(",");
for (const { id } of products.filter(
  (p) => !requested || requested.includes(p.id),
)) {
  const version = id.startsWith("can-") ? "v3" : "v2";
  const doc = await io.read(`output/showcase/${id}.glb`);
  await doc.transform(
    weld(),
    dedup(),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: "webp", quality: 90 }),
  );
  await io.write(`${out}/${id}-${version}.glb`, doc);
  await sharp(`output/showcase/${id}.png`)
    .webp({ quality: 90 })
    .toFile(`${out}/${id}-${version}.webp`);
  report.push({
    id,
    modelBytes: (await stat(`${out}/${id}-${version}.glb`)).size,
    posterBytes: (await stat(`${out}/${id}-${version}.webp`)).size,
  });
}
await writeFile(
  "output/showcase/manifest.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(report);
