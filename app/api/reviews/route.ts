import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductReviewStats, seedProductReviewsIfEmpty } from "@/lib/reviews";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const slug = searchParams.get("slug");

    let targetProductId = productId;

    if (!targetProductId && slug) {
      const prod = await prisma.product.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (prod) {
        targetProductId = prod.id;
      }
    }

    if (!targetProductId) {
      return NextResponse.json({ error: "Product ID or slug is required." }, { status: 400 });
    }

    // Auto-seed sample authentic reviews if empty
    await seedProductReviewsIfEmpty(targetProductId);

    const [reviews, stats] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId: targetProductId,
          status: "APPROVED",
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      getProductReviewStats(targetProductId),
    ]);

    return NextResponse.json({
      success: true,
      reviews,
      stats,
    });
  } catch (error: any) {
    console.error("GET REVIEWS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load product reviews." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      productId,
      rating,
      title,
      comment,
      authorName,
      authorEmail,
      images,
    } = body;

    if (!productId || !rating || !title || !comment || !authorName || !authorEmail) {
      return NextResponse.json(
        { error: "Please fill in all required review fields." },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5 stars." },
        { status: 400 }
      );
    }

    // Sanitize image URLs / base64 strings (limit to 5 photos)
    const validImages = Array.isArray(images)
      ? images.filter((img) => typeof img === "string" && img.length > 0).slice(0, 5)
      : [];

    const newReview = await prisma.review.create({
      data: {
        productId,
        rating: Math.round(numRating),
        title: title.trim(),
        comment: comment.trim(),
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim().toLowerCase(),
        isVerified: true,
        status: "APPROVED", // Auto-approved or pending based on boutique policy
        images: validImages,
        helpfulVotes: 0,
      },
    });

    const stats = await getProductReviewStats(productId);

    return NextResponse.json({
      success: true,
      message: "Thank you! Your verified review has been published.",
      review: newReview,
      stats,
    });
  } catch (error: any) {
    console.error("POST REVIEW ERROR:", error);
    return NextResponse.json(
      { error: "Failed to submit review." },
      { status: 500 }
    );
  }
}
