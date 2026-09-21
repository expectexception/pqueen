import { NextResponse } from "next/server";
import { getBannersData } from "@/lib/banners";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const banners = getBannersData();
    return NextResponse.json({
      success: true,
      banners,
    });
  } catch (error) {
    console.error("PUBLIC BANNERS GET ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load storefront banners." },
      { status: 500 }
    );
  }
}
