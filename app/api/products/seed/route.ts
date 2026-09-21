import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // ----------------------------------------------------
    // 1. LEHENGAS CATEGORY
    // ----------------------------------------------------
    const lehengaCategory = await prisma.category.upsert({
      where: { slug: "lehengas" },
      update: {
        name: "Lehengas",
        description: "Handcrafted bridal, festive, and cocktail lehengas with intricate zari embroidery.",
        image: "/products/lehenga-1.jpg",
      },
      create: {
        name: "Lehengas",
        slug: "lehengas",
        description: "Handcrafted bridal, festive, and cocktail lehengas with intricate zari embroidery.",
        image: "/products/lehenga-1.jpg",
      },
    });

    // ----------------------------------------------------
    // 2. SUIT SETS CATEGORY
    // ----------------------------------------------------
    const suitCategory = await prisma.category.upsert({
      where: { slug: "suit-sets" },
      update: {
        name: "Suit Sets",
        description: "Regal anarkalis, embroidered shararas, and straight-cut celebratory suit sets.",
        image: "/products/suit-1.jpg",
      },
      create: {
        name: "Suit Sets",
        slug: "suit-sets",
        description: "Regal anarkalis, embroidered shararas, and straight-cut celebratory suit sets.",
        image: "/products/suit-1.jpg",
      },
    });

    // ----------------------------------------------------
    // 3. SAREES CATEGORY
    // ----------------------------------------------------
    const sareeCategory = await prisma.category.upsert({
      where: { slug: "sarees" },
      update: {
        name: "Sarees",
        description: "Pre-draped cocktail drapes, tissue organza, and heritage Banarasi silk sarees.",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
      },
      create: {
        name: "Sarees",
        slug: "sarees",
        description: "Pre-draped cocktail drapes, tissue organza, and heritage Banarasi silk sarees.",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
      },
    });

    // ----------------------------------------------------
    // 4. GOWNS & INDO-WESTERN CATEGORY
    // ----------------------------------------------------
    const gownCategory = await prisma.category.upsert({
      where: { slug: "gowns" },
      update: {
        name: "Gowns",
        description: "Haute couture evening reception gowns, trail drapes, and modern Indo-western silhouettes.",
        image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
      },
      create: {
        name: "Gowns",
        slug: "gowns",
        description: "Haute couture evening reception gowns, trail drapes, and modern Indo-western silhouettes.",
        image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
      },
    });

    // ----------------------------------------------------
    // 5. CORD SETS & FUSION WEAR
    // ----------------------------------------------------
    const cordSetCategory = await prisma.category.upsert({
      where: { slug: "cord-sets" },
      update: {
        name: "Cord Sets",
        description: "Contemporary festive cord sets, embroidered jackets, and stylish party silhouettes.",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
      },
      create: {
        name: "Cord Sets",
        slug: "cord-sets",
        description: "Contemporary festive cord sets, embroidered jackets, and stylish party silhouettes.",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
      },
    });

    // ----------------------------------------------------
    // 6. DUPATTAS & TROUSSEAU
    // ----------------------------------------------------
    const dupattaCategory = await prisma.category.upsert({
      where: { slug: "dupattas" },
      update: {
        name: "Dupattas",
        description: "Artisanal Banarasi silk, velvet odhanis, and embellished bridal trousseau dupattas.",
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800",
      },
      create: {
        name: "Dupattas",
        slug: "dupattas",
        description: "Artisanal Banarasi silk, velvet odhanis, and embellished bridal trousseau dupattas.",
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Categories seeded successfully.",
      categories: [
        lehengaCategory,
        suitCategory,
        sareeCategory,
        gownCategory,
        cordSetCategory,
        dupattaCategory,
      ],
    });
  } catch (error) {
    console.error("SEED CATEGORIES ERROR:", error);
    return NextResponse.json(
      { error: "Failed to seed categories." },
      { status: 500 }
    );
  }
}