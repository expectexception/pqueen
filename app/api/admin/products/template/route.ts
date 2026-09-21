import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = [
    "name",
    "category",
    "price",
    "salePrice",
    "sku",
    "stock",
    "sizes",
    "colors",
    "fabric",
    "work",
    "description",
    "weightKg",
    "lengthCm",
    "widthCm",
    "heightCm",
    "imageUrls",
    "featured",
    "status",
  ];

  const sampleRows = [
    [
      "Royal Crimson Velvet Bridal Lehenga",
      "Bridal Lehengas",
      "45000",
      "38500",
      "PQN-LEH-001",
      "15",
      "XS,S,M,L,XL,Custom",
      "Crimson Red,Royal Gold",
      "Pure Micro Velvet",
      "Hand Zardozi with Gold Dabka",
      "Opulent bridal lehenga with heavy 16-kali kalidar flare, hand-embroidered zardozi border, micro-velvet blouse and double dupatta.",
      "2.50",
      "40",
      "30",
      "15",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c,https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b",
      "true",
      "ACTIVE",
    ],
    [
      "Pure Katan Banarasi Silk Saree",
      "Banarasi Sarees",
      "28000",
      "24500",
      "PQN-SAR-002",
      "20",
      "Free Size",
      "Emerald Green,Antique Gold",
      "Pure Katan Silk",
      "Handwoven Kadwa Gold Zari",
      "Masterpiece Banarasi silk saree handwoven on traditional pit looms in Varanasi with antique gold zari jaal and grand pallu.",
      "0.80",
      "30",
      "25",
      "5",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb",
      "false",
      "ACTIVE",
    ],
    [
      "Champagne Gold Crystal Cocktail Gown",
      "Cocktail Gowns",
      "32000",
      "28000",
      "PQN-GWN-003",
      "12",
      "S,M,L,XL",
      "Champagne Gold",
      "Imported French Tulle",
      "Swarovski Crystals & Cutdana",
      "Stunning red-carpet evening gown with structured corset bodice, hand-embellished Swarovski crystals and flowing mermaid flare.",
      "1.80",
      "35",
      "28",
      "10",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae",
      "true",
      "ACTIVE",
    ],
    [
      "Pastel Peach Georgette Anarkali Set",
      "Anarkali & Suits",
      "18500",
      "15900",
      "PQN-SUIT-004",
      "25",
      "XS,S,M,L,XL,XXL",
      "Pastel Peach",
      "Pure Viscose Georgette",
      "Lucknowi Chikankari with Mukaish",
      "Flowy floor-length Anarkali suit paired with churidar pants and a sheer organza scalloped dupatta.",
      "1.20",
      "30",
      "25",
      "8",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
      "false",
      "ACTIVE",
    ],
  ];

  const escapeCsv = (str: string) => {
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.join(","),
    ...sampleRows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\r\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pqn_products_catalog_format_template.csv"`,
    },
  });
}
