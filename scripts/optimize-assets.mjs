import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  prune,
  weld,
  simplify,
  textureCompress,
} from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
import { mkdir, writeFile, stat } from "node:fs/promises";
const out = "apps/web/public/assets";
await mkdir(out, { recursive: true });
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const report = [];
for (const [name, input, poster] of [
  [
    "tropical",
    "output/tropical-can-hq/delster-tropical-can-hq.glb",
    "output/tropical-can-hq/delster-tropical-can-hq-front.png",
  ],
  [
    "classic",
    "output/delster-classic.glb",
    "output/delster-classic-preview.png",
  ],
]) {
  const doc = await io.read(input);
  const triangles = () =>
    doc
      .getRoot()
      .listMeshes()
      .reduce(
        (sum, m) =>
          sum +
          m
            .listPrimitives()
            .reduce(
              (s, p) =>
                s +
                (p.getIndices()?.getCount() ||
                  p.getAttribute("POSITION").getCount()) /
                  3,
              0,
            ),
        0,
      );
  const before = triangles();
  await doc.transform(
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.22, error: 0.001 }),
    dedup(),
    prune(),
    textureCompress({
      encoder: sharp,
      targetFormat: "webp",
      resize: [1024, 1024],
      quality: 85,
    }),
  );
  const output = `${out}/${name}-v1.glb`;
  await io.write(output, doc);
  await sharp(`.local/${name}-poster.png`)
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 86 })
    .toFile(`${out}/${name}-v1.webp`);
  report.push({
    input,
    output,
    trianglesBefore: before,
    trianglesAfter: triangles(),
    bytesBefore: (await stat(input)).size,
    bytesAfter: (await stat(output)).size,
  });
}
await writeFile(
  "docs/asset-measurements.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(report);
