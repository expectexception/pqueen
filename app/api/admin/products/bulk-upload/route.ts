import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionCookieName, verifyAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Simple CSV parser supporting quotes
function parseCSV(text: string): Array<Record<string, string>> {
  const lines: string[] = [];
  let currentRow = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && nextChar === '"' && inQuotes) {
      currentRow += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (currentRow.trim()) {
        lines.push(currentRow.trim());
      }
      currentRow = "";
      if (char === "\r" && nextChar === "\n") i++;
    } else {
      currentRow += char;
    }
  }
  if (currentRow.trim()) lines.push(currentRow.trim());

  if (lines.length === 0) return [];

  // Parse header line
  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let currentVal = "";
    let inQ = false;

    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      const next = line[j + 1];

      if (c === '"' && next === '"' && inQ) {
        currentVal += '"';
        j++;
      } else if (c === '"') {
        inQ = !inQ;
      } else if (c === "," && !inQ) {
        values.push(currentVal.trim());
        currentVal = "";
      } else {
        currentVal += c;
      }
    }
    values.push(currentVal.trim());
    return values;
  };

  const headerKeys = parseLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  const records: Array<Record<string, string>> = [];

  for (let k = 1; k < lines.length; k++) {
    const rowValues = parseLine(lines[k]);
    if (rowValues.every((v) => !v)) continue;

    const rowObj: Record<string, string> = {};
    headerKeys.forEach((key, idx) => {
      rowObj[key] = rowValues[idx] || "";
    });
    records.push(rowObj);
  }

  return records;
}

export async function POST(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await request.json();
    let rows: Array<any> = [];

    if (body.csvText) {
      rows = parseCSV(body.csvText);
    } else if (Array.isArray(body.products)) {
      rows = body.products;
    } else {
      return NextResponse.json({ error: "Please provide CSV text or parsed product rows." }, { status: 400 });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid product entries found in the file." }, { status: 400 });
    }

    const createdProducts = [];
    const errors = [];

    // Preload categories
    const existingCategories = await prisma.category.findMany();
    const categoryMap = new Map<string, string>();
    existingCategories.forEach((c) => categoryMap.set(c.name.toLowerCase().trim(), c.id));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = (row.name || row.productname || "").trim();
      const rawPrice = (row.price || "").toString().replace(/[^0-9.]/g, "");
      const rawSalePrice = (row.saleprice || row.discountprice || "").toString().replace(/[^0-9.]/g, "");
      const categoryName = (row.category || row.categoryname || "Haute Couture").trim();
      const sku = (row.sku || `PQN-${Date.now().toString().slice(-4)}-${i + 1}`).trim();
      const stock = parseInt(row.stock || "10", 10) || 10;
      const description = row.description || `Exquisite handcrafted ${categoryName} ensemble by PQN Party Queen Atelier.`;
      const fabric = row.fabric || "";
      const work = row.work || "";
      const isFeatured = String(row.featured).toLowerCase() === "true" || String(row.featured) === "1";
      const status = (row.status || "ACTIVE").toUpperCase() === "DRAFT" ? "DRAFT" : "ACTIVE";

      if (!name) {
        errors.push(`Row ${i + 1}: Missing Product Name.`);
        continue;
      }
      if (!rawPrice || isNaN(parseFloat(rawPrice))) {
        errors.push(`Row ${i + 1} (${name}): Invalid Price.`);
        continue;
      }

      const price = parseFloat(rawPrice);
      const salePrice = rawSalePrice && !isNaN(parseFloat(rawSalePrice)) ? parseFloat(rawSalePrice) : null;

      // Find or create Category
      let categoryId = categoryMap.get(categoryName.toLowerCase());
      if (!categoryId) {
        const catSlug = slugify(categoryName);
        const newCat = await prisma.category.create({
          data: {
            name: categoryName,
            slug: `${catSlug}-${Date.now().toString().slice(-4)}`,
            description: `Exclusive collection of ${categoryName}`,
          },
        });
        categoryId = newCat.id;
        categoryMap.set(categoryName.toLowerCase(), categoryId);
      }

      // Generate unique slug
      const baseSlug = slugify(name);
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (await prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${baseSlug}-${counter}-${Date.now().toString().slice(-3)}`;
        counter++;
      }

      // Parse sizes and colors for Variants
      const rawSizes = (row.sizes || row.size || "Free Size").split(/[,/|]/).map((s: string) => s.trim()).filter(Boolean);
      const sizes = rawSizes.length > 0 ? rawSizes : ["Free Size"];
      const rawColors = (row.colors || row.color || "Standard").split(/[,/|]/).map((c: string) => c.trim()).filter(Boolean);
      const colors = rawColors.length > 0 ? rawColors : ["Standard"];

      const variantList: Array<{ size: string; color: string; stock: number }> = [];
      sizes.forEach((s: string) => {
        colors.forEach((c: string) => {
          variantList.push({
            size: s,
            color: c,
            stock: Math.max(1, Math.round(stock / (sizes.length * colors.length))),
          });
        });
      });

      // Parse image URLs
      const rawImages = (row.imageurls || row.images || row.imageurl || row.image || "")
        .split(/[,|;]/)
        .map((img: string) => img.trim())
        .filter(Boolean);

      const defaultImage = "https://images.unsplash.com/photo-1610030469983-98e550d6193c";
      const imageList = (rawImages.length > 0 ? rawImages : [defaultImage]).map((url: string, imgIdx: number) => ({
        url,
        altText: `${name} - View ${imgIdx + 1}`,
        sortOrder: imgIdx,
      }));

      // Parse package dimensions & weight
      const rawWeight = row.weightkg || row.weight || row.weightgrams || "";
      let weight = 0.8;
      if (rawWeight && !isNaN(parseFloat(rawWeight))) {
        const parsedWeight = parseFloat(rawWeight);
        weight = parsedWeight > 15 ? parsedWeight / 1000 : parsedWeight; // Convert grams (e.g. 800) to kg (0.8)
      }
      if (weight <= 0) weight = 0.8;

      const rawLength = row.lengthcm || row.length || "30";
      const length = !isNaN(parseFloat(rawLength)) && parseFloat(rawLength) > 0 ? parseFloat(rawLength) : 30;

      const rawWidth = row.widthcm || row.width || row.breadth || "25";
      const width = !isNaN(parseFloat(rawWidth)) && parseFloat(rawWidth) > 0 ? parseFloat(rawWidth) : 25;

      const rawHeight = row.heightcm || row.height || "8";
      const height = !isNaN(parseFloat(rawHeight)) && parseFloat(rawHeight) > 0 ? parseFloat(rawHeight) : 8;

      // Create Product in database
      const created = await prisma.product.create({
        data: {
          name,
          slug: uniqueSlug,
          sku,
          description: `${description}${fabric ? `\n\nFabric: ${fabric}` : ""}${work ? `\nWork: ${work}` : ""}`,
          price,
          salePrice,
          weight,
          length,
          width,
          height,
          categoryId,
          status,
          images: {
            create: imageList,
          },
          variants: {
            create: variantList,
          },
        },
        include: {
          category: true,
          images: true,
          variants: true,
        },
      });

      createdProducts.push(created);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdProducts.length} products to your catalog!`,
      importedCount: createdProducts.length,
      errorsCount: errors.length,
      errors,
      products: createdProducts,
    });
  } catch (error: any) {
    console.error("BULK PRODUCT UPLOAD ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process bulk product catalog upload." },
      { status: 500 }
    );
  }
}
