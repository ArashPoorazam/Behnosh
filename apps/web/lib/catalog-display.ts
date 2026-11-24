import { posterUrl } from "./showcase";
export const catalogDisplay: Record<
  string,
  {
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
    group: "delster",
    color: "#d6eac6",
    accent: "#236348",
    latin: "TROPICAL",
    volume: "۳۳۰ میلی‌لیتر",
    packaging: "قوطی",
    notes: "مالت با حال‌وهوای میوه‌های استوایی",
  },
  "can-lemon": {
    group: "delster",
    color: "#f1edb0",
    accent: "#60712c",
    latin: "LEMON",
    volume: "۳۳۰ میلی‌لیتر",
    packaging: "قوطی",
    notes: "رایحهٔ لیمو، طعمی سرزنده و مرکباتی",
  },
  "can-peach": {
    group: "delster",
    color: "#f7d2cb",
    accent: "#973d47",
    latin: "PEACH",
    volume: "۳۳۰ میلی‌لیتر",
    packaging: "قوطی",
    notes: "رایحهٔ هلو، لطیف و دلنشین",
  },
  "can-pineapple": {
    group: "delster",
    color: "#e6ebb0",
    accent: "#57692c",
    latin: "PINEAPPLE",
    volume: "۳۳۰ میلی‌لیتر",
    packaging: "قوطی",
    notes: "آناناس، آفتابی و استوایی",
  },
  "can-black": {
    group: "delster",
    color: "#ddd5c7",
    accent: "#45483b",
    latin: "BLACK",
    volume: "۳۳۰ میلی‌لیتر",
    packaging: "قوطی",
    notes: "مالت، با شخصیتی متفاوت",
  },
  classic: {
    group: "delster",
    color: "#e7d8b7",
    accent: "#705230",
    latin: "CLASSIC",
    volume: "۳۲۰ میلی‌لیتر",
    packaging: "شیشه‌ای",
    notes: "طعم اصیل و آشنای مالت",
  },
  "bottle-tropical": {
    group: "delster",
    color: "#dce6b9",
    accent: "#4c6331",
    latin: "TROPICAL",
    volume: "۳۲۰ میلی‌لیتر",
    packaging: "شیشه‌ای",
    notes: "طعم استوایی در بطری شیشه‌ای",
  },
  "dadli-orange": {
    group: "dadli",
    color: "#ffd08a",
    accent: "#8d431a",
    latin: "ORANGE",
    volume: "۲۵۰ میلی‌لیتر",
    packaging: "شیشه‌ای",
    notes: "پرتقال، روشن و مرکباتی",
  },
  "dadli-peach": {
    group: "dadli",
    color: "#f5bac4",
    accent: "#702a43",
    latin: "PEACH",
    volume: "۲۵۰ میلی‌لیتر",
    packaging: "شیشه‌ای",
    notes: "هلو، نرم و میوه‌ای",
  },
  "dadli-coconut": {
    group: "dadli",
    color: "#d6e9b2",
    accent: "#244b36",
    latin: "COCONUT",
    volume: "۲۵۰ میلی‌لیتر",
    packaging: "شیشه‌ای",
    notes: "نارگیل، ملایم و استوایی",
  },
  "dadli-blue": {
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
  asset === "classic"
    ? "/assets/classic-v1.webp"
    : posterUrl(asset === "tropical" ? "can-tropical" : asset);
