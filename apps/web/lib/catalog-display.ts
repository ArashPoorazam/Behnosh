import { posterUrl } from "./showcase";
export const catalogDisplay: Record<
  string,
  {
    sourceId: string;
    group: "delster" | "dadli";
    color: string;
    accent: string;
    latin: string;
    volume: string;
    packaging: string;
    notes: string;
  }
> = {
  tropical: {
    sourceId: "182",
    group: "delster",
    color: "#d6eac6",
    accent: "#236348",
    latin: "TROPICAL",
    volume: "۳۳۰ میلی‌لیتر",
    packaging: "قوطی",
    notes: "مالت با حال‌وهوای میوه‌های استوایی",
  },
  "can-lemon": {
    sourceId: "185",
    group: "delster",
    color: "#f1edb0",
    accent: "#60712c",
    latin: "LEMON",
    volume: "۳۳۰ میلی‌لیتر",
    packaging: "قوطی",
    notes: "رایحهٔ لیمو، طعمی سرزنده و مرکباتی",
  },
  "can-peach": {
    sourceId: "186",
    group: "delster",
    color: "#f7d2cb",
    accent: "#973d47",
    latin: "PEACH",
    volume: "۳۳۰ میلی‌لیتر",
    packaging: "قوطی",
    notes: "رایحهٔ هلو، لطیف و دلنشین",
  },
  "can-pineapple": {
    sourceId: "126",
    group: "delster",
    color: "#e6ebb0",
    accent: "#57692c",
    latin: "PINEAPPLE",
    volume: "۳۳۰ میلی‌لیتر",
    packaging: "قوطی",
    notes: "آناناس، آفتابی و استوایی",
  },
  "can-black": {
    sourceId: "240",
    group: "delster",
    color: "#ddd5c7",
    accent: "#45483b",
    latin: "BLACK",
    volume: "۳۳۰ میلی‌لیتر",
    packaging: "قوطی",
    notes: "مالت، با شخصیتی متفاوت",
  },
  classic: {
    sourceId: "152",
    group: "delster",
    color: "#e7d8b7",
    accent: "#705230",
    latin: "CLASSIC",
    volume: "۳۲۰ میلی‌لیتر",
    packaging: "شیشه‌ای",
    notes: "طعم اصیل و آشنای مالت",
  },
  "bottle-tropical": {
    sourceId: "232",
    group: "delster",
    color: "#dce6b9",
    accent: "#4c6331",
    latin: "TROPICAL",
    volume: "۳۲۰ میلی‌لیتر",
    packaging: "شیشه‌ای",
    notes: "طعم استوایی در بطری شیشه‌ای",
  },
  "dadli-orange": {
    sourceId: "199",
    group: "dadli",
    color: "#ffd08a",
    accent: "#8d431a",
    latin: "ORANGE",
    volume: "۲۵۰ میلی‌لیتر",
    packaging: "شیشه‌ای",
    notes: "پرتقال، روشن و مرکباتی",
  },
  "dadli-peach": {
    sourceId: "198",
    group: "dadli",
    color: "#f5bac4",
    accent: "#702a43",
    latin: "PEACH",
    volume: "۲۵۰ میلی‌لیتر",
    packaging: "شیشه‌ای",
    notes: "هلو، نرم و میوه‌ای",
  },
  "dadli-coconut": {
    sourceId: "197",
    group: "dadli",
    color: "#d6e9b2",
    accent: "#244b36",
    latin: "COCONUT",
    volume: "۲۵۰ میلی‌لیتر",
    packaging: "شیشه‌ای",
    notes: "نارگیل، ملایم و استوایی",
  },
  "dadli-blue": {
    sourceId: "194",
    group: "dadli",
    color: "#b4e5f0",
    accent: "#104961",
    latin: "BLUE TROPICAL",
    volume: "۲۵۰ میلی‌لیتر",
    packaging: "شیشه‌ای",
    notes: "بلوتروپیکال، با حال‌وهوای استوایی",
  },
};
export const productPoster = (asset: string) =>
  asset.startsWith("catalog-")
    ? `/assets/catalog/${asset.slice(8)}-v1.webp`
    : asset === "classic"
      ? "/assets/classic-v1.webp"
      : posterUrl(asset === "tropical" ? "can-tropical" : asset);
