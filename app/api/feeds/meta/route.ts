import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const origin = url.origin || "https://pqnpartyqueen.com";

    // Query active products from database
    const products = await prisma.product.findMany({
      where: {
        status: { in: ["ACTIVE", "DRAFT"] }, // include items
      },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
        variants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const itemsXml = products
      .map((p) => {
        const prodLink = `${origin}/shop/${p.slug}`;
        const primaryImage = p.images?.[0]?.url || `${origin}/logopq.png`;
        const additionalImages = p.images.slice(1).map((img) => img.url);

        const priceNum = Number(p.price) || 0;
        const salePriceNum = p.salePrice ? Number(p.salePrice) : null;

        const sizes = Array.from(new Set(p.variants.map((v) => v.size).filter(Boolean))).join("/");
        const colors = Array.from(new Set(p.variants.map((v) => v.color).filter(Boolean))).join("/");

        const catName = p.category?.name || "Luxury Indian Couture";
        const cleanDesc = (p.description || `Exquisite handcrafted ${catName} by PQN Party Queen Atelier.`).trim();

        return `
    <item>
      <g:id>${escapeXml(p.sku || p.id)}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${cleanDesc}]]></g:description>
      <g:link>${escapeXml(prodLink)}</g:link>
      <g:image_link>${escapeXml(primaryImage.startsWith("http") ? primaryImage : `${origin}${primaryImage}`)}</g:image_link>
      ${additionalImages
        .map(
          (imgUrl) =>
            `<g:additional_image_link>${escapeXml(imgUrl.startsWith("http") ? imgUrl : `${origin}${imgUrl}`)}</g:additional_image_link>`
        )
        .join("\n      ")}
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${priceNum.toFixed(2)} INR</g:price>
      ${salePriceNum ? `<g:sale_price>${salePriceNum.toFixed(2)} INR</g:sale_price>` : ""}
      <g:brand>PQN PARTY QUEEN</g:brand>
      <g:google_product_category>Apparel &amp; Accessories &gt; Clothing &gt; Traditional &amp; Ceremonial Clothing</g:google_product_category>
      <g:product_type>${escapeXml(catName)}</g:product_type>
      <g:gender>female</g:gender>
      <g:age_group>adult</g:age_group>
      ${sizes ? `<g:size>${escapeXml(sizes)}</g:size>` : ""}
      ${colors ? `<g:color>${escapeXml(colors)}</g:color>` : ""}
      <g:item_group_id>${escapeXml(p.categoryId || "pqn-couture")}</g:item_group_id>
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>PQN PARTY QUEEN | Official Product Catalog Feed</title>
    <link>${origin}</link>
    <description>Live product data feed for Facebook Catalog, Instagram Shopping, and Meta Commerce Manager.</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("META CATALOG FEED ERROR:", error);
    return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><error>Failed to generate catalog feed</error>", {
      status: 500,
      headers: { "Content-Type": "application/xml" },
    });
  }
}
