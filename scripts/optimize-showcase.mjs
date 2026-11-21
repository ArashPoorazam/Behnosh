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
for (const { id } of products) {
  const doc = await io.read(`output/showcase/${id}.glb`);
  await doc.transform(
    weld(),
    dedup(),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: "webp", quality: 90 }),
  );
  await io.write(`${out}/${id}-v2.glb`, doc);
  await sharp(`output/showcase/${id}.png`)
    .webp({ quality: 90 })
    .toFile(`${out}/${id}-v2.webp`);
  report.push({
    id,
    modelBytes: (await stat(`${out}/${id}-v2.glb`)).size,
    posterBytes: (await stat(`${out}/${id}-v2.webp`)).size,
  });
}
await sharp("output/showcase/antarctic.png")
  .resize({ width: 1920, withoutEnlargement: true })
  .webp({ quality: 88 })
  .toFile(`${out}/antarctic-v1.webp`);
await writeFile(
  "output/showcase/manifest.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(report);
