import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-auth";

const BUCKET_NAME = "product-images";

function getAdminTokenFromRequest(
  request: Request
): string | undefined {
  const cookieHeader =
    request.headers.get("cookie") || "";

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) =>
      cookie.startsWith(
        `${getAdminSessionCookieName()}=`
      )
    )
    ?.split("=")
    .slice(1)
    .join("=");
}

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // ADMIN AUTHENTICATION
    // --------------------------------------------------

    const token = getAdminTokenFromRequest(request);
    const valid = await verifyAdminSession(token);

    if (!valid) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // PARSE PAYLOAD (JSON Base64 or FormData robustly)
    // --------------------------------------------------

    let buffer: Buffer | null = null;
    let fileType: string = "image/webp";
    let fileName: string = "image.webp";

    const rawText = await request.text();

    if (rawText && rawText.trim().startsWith("{")) {
      try {
        const jsonBody = JSON.parse(rawText);
        if (jsonBody && (jsonBody.fileData || jsonBody.base64)) {
          const fileData = jsonBody.fileData || jsonBody.base64;
          fileName = jsonBody.fileName || "image.webp";
          fileType = jsonBody.fileType || "image/webp";

          const base64Index = fileData.indexOf(";base64,");
          const cleanBase64 = base64Index !== -1 ? fileData.slice(base64Index + 8) : fileData;
          buffer = Buffer.from(cleanBase64, "base64");
        }
      } catch (jsonErr) {
        console.warn("JSON parse notice:", jsonErr);
      }
    }

    if (!buffer) {
      return NextResponse.json(
        { error: "Please select or provide a valid image file." },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // VALIDATE FILE TYPE
    // --------------------------------------------------

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ];

    if (!allowedTypes.includes(fileType.toLowerCase())) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP, GIF and SVG images are allowed." },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // VALIDATE FILE SIZE (Max 15 MB)
    // --------------------------------------------------

    const maxFileSize = 15 * 1024 * 1024;
    if (buffer.length > maxFileSize) {
      return NextResponse.json(
        { error: "Image size must be 15 MB or smaller." },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // CREATE UNIQUE FILE NAME & STORAGE PATH
    // --------------------------------------------------

    const extension =
      fileName.split(".").pop()?.toLowerCase() ||
      (fileType.includes("webp") ? "webp" : "jpg");

    const uniqueFileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `products/${uniqueFileName}`;

    // --------------------------------------------------
    // UPLOAD TO SUPABASE STORAGE
    // --------------------------------------------------

    const { error: uploadError } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: fileType,
        upsert: true,
      });

    if (uploadError) {
      console.error("SUPABASE IMAGE UPLOAD ERROR:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image to cloud storage: " + uploadError.message },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // GET PUBLIC URL
    // --------------------------------------------------

    const { data: publicUrlData } = supabaseServer.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    if (!publicUrl) {
      return NextResponse.json(
        { error: "Image uploaded but public URL could not be created." },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
    });
  } catch (error) {
    console.error("ADMIN IMAGE UPLOAD ERROR:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload image.",
      },
      { status: 500 }
    );
  }
}