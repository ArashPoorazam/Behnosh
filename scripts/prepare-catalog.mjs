import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";

const { products } = JSON.parse(
  await readFile("api/catalog/products.json", "utf8"),
);
const out = "apps/web/public/assets/catalog";
await mkdir(out, { recursive: true });
let bytes = 0;
for (const product of products) {
  const result = await sharp(product.image_path)
    .trim({ threshold: 12 })
    .resize({
      width: 480,
      height: 600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toFile(`${out}/${product.source_id}-v1.webp`);
  bytes += result.size;
}
console.log(
  `Prepared ${products.length} catalog photos (${Math.round(bytes / 1024)} KiB).`,
);
