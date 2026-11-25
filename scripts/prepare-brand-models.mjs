// Build rotational profiles from the catalog silhouettes. Front artwork is
// photo-projected onto real geometry; unseen rear surfaces are plain lacquer.
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const products = {
  127: ["bottle", "#e95199"],
  128: ["can", "#e74a98"],
  242: ["can", "#171719"],
  243: ["can", "#171719"],
  241: ["bottle", "#111115"],
  145: ["can", "#eeeeeb"],
  143: ["bottle", "#662919"],
  141: ["can", "#174e9b"],
  160: ["can", "#174e9b"],
  140: ["bottle", "#164a91"],
  142: ["pet", "#164a91"],
};
const models = {};
for (const [id, [kind, color]] of Object.entries(products)) {
  const { data, info } = await sharp(
    `apps/web/public/assets/catalog/${id}-v1.webp`,
  )
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const profile = [];
  for (let i = 0; i <= 56; i++) {
    const y = Math.max(
      2,
      Math.min(height - 3, Math.round((i / 56) * (height - 1))),
    );
    const bounds = [];
    for (let row = y - 1; row <= y + 1; row++) {
      let left = width,
        right = 0;
      for (let x = 0; x < width; x++)
        if (data[(row * width + x) * 4 + 3] > 180) {
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
      if (right > left) bounds.push((right - left) / 2);
    }
    profile.push(
      Number(
        (
          (bounds.reduce((a, b) => a + b, 0) / (bounds.length || 1) / height) *
          3.4
        ).toFixed(4),
      ),
    );
  }
  models[id] = { kind, color, aspect: width / height, profile };
}
await writeFile("apps/web/lib/brand-models.json", JSON.stringify(models));
console.log(
  `Prepared ${Object.keys(models).length} rotational product profiles.`,
);
