import fs from "fs";
import path from "path";

export type BannerSlide = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  badge?: string;
  active: boolean;
  order: number;
};

export type BannerData = {
  heroSlides: BannerSlide[];
  announcements: string[];
  promoCard: {
    title: string;
    description: string;
    couponCode: string;
    discountPercent: number;
    active: boolean;
  };
};

const BANNERS_FILE_PATH = path.join(process.cwd(), "data", "banners.json");

const DEFAULT_BANNERS: BannerData = {
  heroSlides: [
    {
      id: "slide-1",
      title: "Elegance Crafted for Your Special Moments",
      subtitle: "Immerse yourself in artisan-embroidered designer lehengas, majestic royal suit sets, and breathtaking party wear curated to make you the queen of every occasion.",
      imageUrl: "",
      ctaText: "EXPLORE COLLECTION",
      ctaLink: "/shop",
      badge: "2026 Haute Couture Collection",
      active: true,
      order: 1,
    },
    {
      id: "slide-2",
      title: "Royal Banarasi & Heritage Sarees",
      subtitle: "Timeless drape and handwoven gold zari motifs designed for the grandest celebrations.",
      imageUrl: "",
      ctaText: "DISCOVER SAREES",
      ctaLink: "/shop?category=sarees",
      badge: "Exclusive Atelier Edit",
      active: true,
      order: 2,
    },
  ],
  announcements: [
    "✦ COMPLIMENTARY EXPRESS SHIPPING ACROSS INDIA • USE CODE PQN10 FOR 10% OFF ✦",
  ],
  promoCard: {
    title: "Your Grand Entrance Starts Here. Enjoy 10% Off Your First Order.",
    description: "Experience the royal privilege. Use promo code at checkout for immediate celebratory savings.",
    couponCode: "PQN10",
    discountPercent: 10,
    active: true,
  },
};

export function getBannersData(): BannerData {
  try {
    if (fs.existsSync(BANNERS_FILE_PATH)) {
      const content = fs.readFileSync(BANNERS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      return { ...DEFAULT_BANNERS, ...parsed };
    }
  } catch (err) {
    console.error("[Banners Store] Read error:", err);
  }
  return DEFAULT_BANNERS;
}

export function saveBannersData(data: BannerData): void {
  try {
    const dir = path.dirname(BANNERS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BANNERS_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Banners Store] Save error:", err);
  }
}
