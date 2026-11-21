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
  {
    asset: "can-peach",
    position: [-1.65, -0.12, -0.35],
    rotation: [0.12, -0.2, -0.23],
    scale: 0.91,
  },
  {
    asset: "can-black",
    position: [1.65, -0.12, -0.35],
    rotation: [0.12, 0.18, 0.23],
    scale: 0.91,
  },
  {
    asset: "can-lemon",
    position: [0, 0.12, 0.35],
    rotation: [0.08, -0.07, -0.07],
    scale: 1.06,
  },
];
export const modelUrl = (asset: string) => `/assets/showcase/${asset}-v2.glb`;
export const posterUrl = (asset: string) => `/assets/showcase/${asset}-v2.webp`;
