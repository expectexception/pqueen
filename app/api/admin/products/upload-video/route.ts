import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAdminSessionCookieName, verifyAdminSession } from "@/lib/admin-auth";
import fs from "fs";
import path from "path";

function getAdminTokenFromRequest(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${getAdminSessionCookieName()}=`))
    ?.split("=")[1];
}

export async function POST(request: Request) {
  try {
    const token = getAdminTokenFromRequest(request);
    const valid = await verifyAdminSession(token);

    if (!valid) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let buffer: Buffer;
    let fileType: string = "video/mp4";
    let fileName: string = "runway.mp4";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const jsonBody = await request.json();
      const fileData = jsonBody.fileData || jsonBody.base64;
      fileName = jsonBody.fileName || "runway.mp4";
      fileType = jsonBody.fileType || "video/mp4";

      if (!fileData || typeof fileData !== "string") {
        return NextResponse.json({ error: "Please provide valid video data." }, { status: 400 });
      }

      const base64Index = fileData.indexOf(";base64,");
      const cleanBase64 = base64Index !== -1 ? fileData.slice(base64Index + 8) : fileData;
      buffer = Buffer.from(cleanBase64, "base64");
    } else {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Please select a video file." }, { status: 400 });
      }

      fileName = file.name;
      fileType = file.type;
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    const maxFileSize = 60 * 1024 * 1024; // 60 MB
    if (buffer.length > maxFileSize) {
      return NextResponse.json(
        { error: "Video file size must be 60 MB or smaller." },
        { status: 400 }
      );
    }

    const ext = fileName.split(".").pop()?.toLowerCase() || "mp4";
    const uniqueFileName = `runway-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${ext}`;

    // Try Supabase Storage first
    try {
      const filePath = `videos/${uniqueFileName}`;
      const { error: uploadError } = await supabaseServer.storage
        .from("product-images")
        .upload(filePath, buffer, {
          contentType: fileType || "video/mp4",
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabaseServer.storage
          .from("product-images")
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return NextResponse.json({
            success: true,
            url: publicUrlData.publicUrl,
            fileName: uniqueFileName,
          });
        }
      }
    } catch (supErr) {
      console.warn("Supabase video storage upload bypassed, saving to local public:", supErr);
    }

    // Local public storage fallback
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "videos");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFilePath = path.join(uploadsDir, uniqueFileName);
    fs.writeFileSync(localFilePath, buffer);

    const publicUrl = `/uploads/videos/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
    });
  } catch (error: any) {
    console.error("ADMIN VIDEO UPLOAD ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process video upload." },
      { status: 500 }
    );
  }
}
