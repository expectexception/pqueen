import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    const review = await prisma.review.update({
      where: { id },
      data: {
        helpfulVotes: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      helpfulVotes: review.helpfulVotes,
    });
  } catch (error: any) {
    console.error("VOTE REVIEW ERROR:", error);
    return NextResponse.json(
      { error: "Could not record helpful vote." },
      { status: 500 }
    );
  }
}
