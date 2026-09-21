import { NextResponse } from "next/server";
import { resolveIndianPincode } from "@/lib/indian-logistics";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const resolved = await resolveIndianPincode(code);

    if (!resolved) {
      return NextResponse.json(
        { error: "Invalid or unsupported 6-digit Indian PIN code." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      pincode: code,
      ...resolved,
    });
  } catch (error) {
    console.error("PINCODE RESOLUTION ERROR:", error);
    return NextResponse.json(
      { error: "Failed to resolve PIN code." },
      { status: 500 }
    );
  }
}
