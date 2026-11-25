export type BrandProduct = {
  id: string;
  label: string;
  volume: string;
  packaging: string;
};

export type BrandExperience = {
  slug: string;
  name: string;
  latin: string;
  detail: string;
  products: BrandProduct[];
};

// Packaging and volumes come from api/catalog/products.json; imagery stays original.
export const brandExperiences: Record<string, BrandExperience> = {
  aloe: {
    slug: "aloe",
    name: "آلوئه ورا",
    latin: "ALOEVERA",
    detail: "طعم آلوئه ورا · بدون گاز",
    products: [
      { id: "127", label: "شیشه", volume: "۲۵۰", packaging: "شیشه‌ای" },
      { id: "128", label: "قوطی", volume: "۲۵۰", packaging: "قوطی" },
    ],
  },
  start: {
    slug: "start",
    name: "استارت",
    latin: "START",
    detail: "نوشابه انرژی‌زا · استارت",
    products: [
      { id: "242", label: "مشکی ۲۵۰", volume: "۲۵۰", packaging: "قوطی مشکی" },
      { id: "243", label: "مشکی ۵۰۰", volume: "۵۰۰", packaging: "قوطی مشکی" },
      { id: "241", label: "شیشه مشکی", volume: "۲۵۰", packaging: "شیشه مشکی" },
      { id: "145", label: "کلاسیک", volume: "۲۵۰", packaging: "قوطی کلاسیک" },
    ],
  },
  "vitamin-c": {
    slug: "vitamin-c",
    name: "ویتامین سی",
    latin: "VITAMIN C",
    detail: "حاوی ویتامین C · نوشیدنی گازدار",
    products: [
      { id: "143", label: "ویتامین سی", volume: "۲۴۰", packaging: "شیشه‌ای" },
    ],
  },
  synergy: {
    slug: "synergy",
    name: "سینرژی",
    latin: "SYNERGY",
    detail: "نوشابه انرژی‌زا · سینرژی",
    products: [
      { id: "141", label: "قوطی ۲۵۰", volume: "۲۵۰", packaging: "قوطی" },
      { id: "160", label: "قوطی ۵۰۰", volume: "۵۰۰", packaging: "قوطی" },
      { id: "140", label: "شیشه", volume: "۲۵۰", packaging: "شیشه‌ای" },
      { id: "142", label: "یک لیتری", volume: "۱۰۰۰", packaging: "پت" },
    ],
  },
};
