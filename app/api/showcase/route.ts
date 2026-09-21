import { NextResponse } from "next/server";
import { getShowcaseCards } from "@/lib/showcase";

export async function GET() {
  try {
    const cards = getShowcaseCards();
    return NextResponse.json({
      success: true,
      cards,
    });
  } catch (error) {
    console.error("SHOWCASE GET ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load showcase cards." },
      { status: 500 }
    );
  }
}
