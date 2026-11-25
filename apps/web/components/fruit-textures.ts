"use client";
import { CanvasTexture, SRGBColorSpace, RepeatWrapping } from "three";
/** Deterministic procedural food surfaces; no downloaded textures or image edits. */
export function fruitTexture(
  kind: "citrus" | "lemon" | "peach" | "shell" | "pit",
) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const base = {
    citrus: "#ff9b16",
    lemon: "#e5ed76",
    peach: "#ffb66c",
    shell: "#62402a",
    pit: "#934d2e",
  }[kind];
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4500; i++) {
    const x = random() * 256,
      y = random() * 256;
    ctx.fillStyle =
      kind === "citrus" || kind === "lemon"
        ? `rgba(255,237,143,${random() * 0.45})`
        : kind === "peach"
          ? `rgba(233,89,54,${random() * 0.16})`
          : `rgba(${random() > 0.5 ? "245,191,117" : "33,17,10"},${random() * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      kind === "pit" ? 1 : random() * 2 + 0.5,
      kind === "pit" ? random() * 9 + 2 : random() * 3 + 0.6,
      kind === "citrus" ? -0.3 : random() * 3,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  return texture;
}
