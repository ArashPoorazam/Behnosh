export const dadliFlavors = [
  {
    id: "orange",
    name: "پرتقال",
    latin: "ORANGE",
    color: "#ffd08a",
    ink: "#653011",
    accent: "#ee851c",
    fruit: "orange",
    notes: ["پرتقال آبدار", "پوست مرکبات", "حباب‌های ریز"],
    description: "روشن و مرکباتی؛ با شیرینی ملایم و پایانی تازه.",
    profile: [68, 82, 70],
  },
  {
    id: "peach",
    name: "هلو",
    latin: "PEACH",
    color: "#f5bac4",
    ink: "#702a43",
    accent: "#ca617c",
    fruit: "peach",
    notes: ["هلوی رسیده", "رایحه‌ی میوه", "حباب‌های ریز"],
    description: "نرم و میوه‌ای؛ با عطر هلو و شیرینی دلنشین.",
    profile: [88, 40, 65],
  },
  {
    id: "coconut",
    name: "نارگیل",
    latin: "COCONUT",
    color: "#d6e9b2",
    ink: "#244b36",
    accent: "#699d50",
    fruit: "coconut",
    notes: ["نارگیل تازه", "حس استوایی", "حباب‌های ریز"],
    description: "ملایم و استوایی؛ با رایحه‌ی آشنای نارگیل.",
    profile: [72, 25, 60],
  },
  {
    id: "blue",
    name: "بلوتروپیکال",
    latin: "BLUE TROPICAL",
    color: "#b4e5f0",
    ink: "#104961",
    accent: "#2a9ebc",
    fruit: "pineapple",
    notes: ["آناناس", "میوه‌های استوایی", "حباب‌های ریز"],
    description: "ترکیبی از طعم‌های استوایی، با حسی خنک و میوه‌ای.",
    profile: [70, 65, 85],
  },
] as const;
export type FruitKind = (typeof dadliFlavors)[number]["fruit"];
export type SceneProduct = {
  asset: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
};
export const heroProducts: SceneProduct[] = [
  "can-peach",
  "can-lemon",
  "can-black",
  "can-tropical",
  "can-pineapple",
].map((asset) => ({
  asset,
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: 1,
}));
const assetVersion = (asset: string) =>
  asset.startsWith("can-") ? "v3" : "v2";
export const modelUrl = (asset: string) =>
  `/assets/showcase/${asset}-${assetVersion(asset)}.glb`;
export const posterUrl = (asset: string) =>
  `/assets/showcase/${asset}-${assetVersion(asset)}.webp`;
export const dadliProducts: SceneProduct[] = dadliFlavors.map((f) => ({
  asset: `dadli-${f.id}`,
  position: [0, 0, 0],
  rotation: [0.04, -0.06, -0.11],
  scale: 1.13,
}));
