import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { virtualTryOnService } from "@/lib/vto/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userImage, productId, garmentImageUrl, category, garmentDescription } = body;

    if (!userImage) {
      return NextResponse.json(
        { error: "Please upload or select your photo for the virtual fitting." },
        { status: 400 }
      );
    }

    let finalGarmentUrl = garmentImageUrl;
    let finalCategory = category || "one-pieces";
    let finalDescription = garmentDescription || "Luxury Ensemble";

    // If productId is provided, lookup the product details from the database
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
          category: true,
        },
      });

      if (product) {
        if (!finalGarmentUrl && product.images.length > 0) {
          finalGarmentUrl = product.images[0].url;
        }
        if (product.category?.name) {
          finalCategory = product.category.name;
        }
        finalDescription = `${product.name} - ${product.description || ""}`;
      }
    }

    if (!finalGarmentUrl) {
      return NextResponse.json(
        { error: "No garment image found for this outfit." },
        { status: 400 }
      );
    }

    // Process Try-On through VirtualTryOnService
    const result = await virtualTryOnService.processTryOn({
      modelImageUrl: userImage,
      garmentImageUrl: finalGarmentUrl,
      category: finalCategory,
      garmentDescription: finalDescription,
      mode: "quality",
    });

    return NextResponse.json({
      success: true,
      resultImageUrl: result.resultImageUrl,
      provider: result.provider,
      tryOnId: result.tryOnId,
      processingTimeMs: result.processingTimeMs,
      stylingNote: result.stylingNote || null,
    });
  } catch (error: any) {
    console.error("VIRTUAL TRY-ON API ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process virtual try-on." },
      { status: 500 }
    );
  }
}
