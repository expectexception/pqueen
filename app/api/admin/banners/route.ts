import { NextResponse } from "next/server";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-auth";
import fs from "fs";
import path from "path";

type BannerSlide = {
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

type BannerData = {
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

function getAdminTokenFromRequest(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${getAdminSessionCookieName()}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

function getBannersData(): BannerData {
  try {
    if (fs.existsSync(BANNERS_FILE_PATH)) {
      const content = fs.readFileSync(BANNERS_FILE_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading banners file:", err);
  }

  // Default fallback data
  return {
    heroSlides: [
      {
        id: "slide-1",
        title: "Elegance Crafted for Your Special Moments",
        subtitle: "Immerse yourself in artisan-embroidered designer lehengas, majestic royal suit sets, and breathtaking party wear.",
        imageUrl: "/logopq.png",
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
}

function saveBannersData(data: BannerData) {
  const dir = path.dirname(BANNERS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(BANNERS_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = getBannersData();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const token = getAdminTokenFromRequest(req);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const currentData = getBannersData();

    if (body.action === "add_slide") {
      const newSlide: BannerSlide = {
        id: `slide-${Date.now()}`,
        title: body.slide.title || "New Atelier Slide",
        subtitle: body.slide.subtitle || "",
        imageUrl: body.slide.imageUrl || "",
        ctaText: body.slide.ctaText || "SHOP NOW",
        ctaLink: body.slide.ctaLink || "/shop",
        badge: body.slide.badge || "Featured",
        active: body.slide.active ?? true,
        order: currentData.heroSlides.length + 1,
      };
      currentData.heroSlides.push(newSlide);
    } else if (body.action === "update_slide") {
      const idx = currentData.heroSlides.findIndex((s) => s.id === body.slide.id);
      if (idx !== -1) {
        currentData.heroSlides[idx] = {
          ...currentData.heroSlides[idx],
          ...body.slide,
        };
      }
    } else if (body.action === "delete_slide") {
      currentData.heroSlides = currentData.heroSlides.filter((s) => s.id !== body.slideId);
    } else if (body.action === "update_all") {
      if (body.heroSlides) currentData.heroSlides = body.heroSlides;
      if (body.announcements) currentData.announcements = body.announcements;
      if (body.promoCard) currentData.promoCard = body.promoCard;
    }

    saveBannersData(currentData);
    return NextResponse.json({ success: true, data: currentData });
  } catch (err: any) {
    console.error("Banner save error:", err);
    return NextResponse.json({ error: "Failed to save banner data." }, { status: 500 });
  }
}
