require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const baseUrl = "https://pqnpartyqueen.com";

async function generateStaticSitemap() {
  try {
    console.log("Generating static sitemap.xml from Supabase PostgreSQL...");
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        select: { slug: true, updatedAt: true },
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

    const sitemapPath = path.join(__dirname, "..", "public", "sitemap.xml");
    fs.writeFileSync(sitemapPath, xml, "utf-8");
    console.log(`✓ sitemap.xml generated with ${staticUrls.length + categories.length + products.length} URLs!`);
  } catch (err) {
    console.error("Error generating sitemap:", err);
  } finally {
    await prisma.$disconnect();
  }
}

generateStaticSitemap();
