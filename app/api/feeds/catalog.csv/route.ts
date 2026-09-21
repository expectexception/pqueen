import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function escapeCsvField(val: string | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, " ");
  return `"${str}"`;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const origin = url.origin || "https://pqnpartyqueen.com";

    const products = await prisma.product.findMany({
      where: { status: { in: ["ACTIVE", "DRAFT"] } },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "id",
      "title",
      "description",
      "availability",
      "condition",
      "price",
      "sale_price",
      "link",
      "image_link",
      "additional_image_link",
      "brand",
      "google_product_category",
      "fb_product_category",
      "gender",
      "age_group",
      "color",
      "size",
      "item_group_id",
    ];

    const rows = products.map((p) => {
      const prodLink = `${origin}/shop/${p.slug}`;
      const primaryImage = p.images?.[0]?.url || `${origin}/logopq.png`;
      const fullPrimaryImage = primaryImage.startsWith("http") ? primaryImage : `${origin}${primaryImage}`;

      const additionalImages = p.images
        .slice(1)
        .map((img) => (img.url.startsWith("http") ? img.url : `${origin}${img.url}`))
        .join(",");

      const priceNum = Number(p.price) || 0;
      const salePriceNum = p.salePrice ? Number(p.salePrice) : null;

      const sizes = Array.from(new Set(p.variants.map((v) => v.size).filter(Boolean))).join("/");
      const colors = Array.from(new Set(p.variants.map((v) => v.color).filter(Boolean))).join("/");

      const catName = p.category?.name || "Luxury Indian Couture";
      const cleanDesc = (p.description || `Exquisite handcrafted ${catName} by PQN Party Queen Atelier.`).trim();

      return [
        escapeCsvField(p.sku || p.id),
        escapeCsvField(p.name),
        escapeCsvField(cleanDesc),
        escapeCsvField("in stock"),
        escapeCsvField("new"),
        escapeCsvField(`${priceNum.toFixed(2)} INR`),
        escapeCsvField(salePriceNum ? `${salePriceNum.toFixed(2)} INR` : ""),
        escapeCsvField(prodLink),
        escapeCsvField(fullPrimaryImage),
        escapeCsvField(additionalImages),
        escapeCsvField("PQN PARTY QUEEN"),
        escapeCsvField("Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing"),
        escapeCsvField("clothing & accessories > clothing"),
        escapeCsvField("female"),
        escapeCsvField("adult"),
        escapeCsvField(colors),
        escapeCsvField(sizes),
        escapeCsvField(p.categoryId || "pqn-couture"),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="pqn_catalog_feed.csv"',
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("CSV CATALOG FEED ERROR:", error);
    return new NextResponse("Error generating CSV catalog feed", { status: 500 });
  }
}
