import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pqnpartyqueen.com";

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
        take: 1000,
      }),
      prisma.category.findMany({
        select: { slug: true, updatedAt: true },
        take: 100,
      }),
    ]);

    const staticUrls = [
      { loc: baseUrl, priority: "1.0", changefreq: "daily" },
      { loc: `${baseUrl}/shop`, priority: "0.9", changefreq: "daily" },
      { loc: `${baseUrl}/style-quiz`, priority: "0.8", changefreq: "weekly" },
      { loc: `${baseUrl}/about`, priority: "0.7", changefreq: "monthly" },
      { loc: `${baseUrl}/contact`, priority: "0.7", changefreq: "monthly" },
      { loc: `${baseUrl}/shipping`, priority: "0.6", changefreq: "monthly" },
      { loc: `${baseUrl}/returns`, priority: "0.6", changefreq: "monthly" },
      { loc: `${baseUrl}/faq`, priority: "0.6", changefreq: "monthly" },
      { loc: `${baseUrl}/terms`, priority: "0.4", changefreq: "yearly" },
      { loc: `${baseUrl}/privacy`, priority: "0.4", changefreq: "yearly" },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    for (const page of staticUrls) {
      xml += `  <url>\n`;
      xml += `    <loc>${page.loc}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Categories
    for (const cat of categories) {
      const lastMod = cat.updatedAt ? new Date(cat.updatedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/shop?category=${cat.slug}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // Products
    for (const prod of products) {
      const lastMod = prod.updatedAt ? new Date(prod.updatedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/shop/${prod.slug}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.85</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new NextResponse("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>", {
      status: 500,
      headers: { "Content-Type": "application/xml" },
    });
  }
}
