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
  eyebrow: string;
  title: [string, string];
  description: string;
  signature: string;
  detail: string;
  products: BrandProduct[];
};

// Packaging and volumes come from api/catalog/products.json; imagery stays original.
export const brandExperiences: Record<string, BrandExperience> = {
  aloe: {
    slug: "aloe",
    name: "آلوئه ورا",
    latin: "ALOEVERA",
    eyebrow: "طبیعت، به رنگ صورتی",
    title: ["کمی مکث،", "کمی طبیعت."],
    description:
      "از سبزیِ آلوئه ورا تا دنیایی صورتی؛ یک نوشیدنی میوه‌ای بدون گاز، برای لحظه‌های آرامِ تو.",
    signature: "A LITTLE NATURE. A LITTLE PAUSE.",
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
    eyebrow: "جسارت، از یک شروع",
    title: ["رام نمی‌شی.", "شروع می‌کنی."],
    description:
      "مشکیِ جسور. طلاییِ بی‌پروا. استارت، با نشان یوز و شخصیتی که برای درخشیدن ساخته شده.",
    signature: "BORN TO BE BOLD.",
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
    eyebrow: "یک شیشه، یک حال تازه",
    title: ["کوچیکه،", "ولی پُر از سی!"],
    description:
      "نوشیدنی گازدار حاوی ویتامین C و ویتامین‌های گروه B؛ در یک شیشه‌ی کهربایی با امضای زرد و قرمز.",
    signature: "SMALL BOTTLE. BRIGHT MOMENT.",
    detail: "حاوی ویتامین C · نوشیدنی گازدار",
    products: [
      { id: "143", label: "ویتامین سی", volume: "۲۴۰", packaging: "شیشه‌ای" },
    ],
  },
  synergy: {
    slug: "synergy",
    name: "سینرژی",
    latin: "SYNERGY",
    eyebrow: "انرژی، روی دور تند",
    title: ["ضربانِ لحظه،", "دستِ توئه."],
    description:
      "آبیِ الکتریکی، قرمزِ آتشین. سینرژی، نوشابه انرژی‌زا برای لحظه‌هایی با ریتم متفاوت.",
    signature: "FEEL THE MOMENT. FIND YOUR DRIVE.",
    detail: "نوشابه انرژی‌زا · سینرژی",
    products: [
      { id: "141", label: "قوطی ۲۵۰", volume: "۲۵۰", packaging: "قوطی" },
      { id: "160", label: "قوطی ۵۰۰", volume: "۵۰۰", packaging: "قوطی" },
      { id: "140", label: "شیشه", volume: "۲۵۰", packaging: "شیشه‌ای" },
      { id: "142", label: "یک لیتری", volume: "۱۰۰۰", packaging: "پت" },
    ],
  },
};
