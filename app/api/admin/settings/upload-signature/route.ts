import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-auth";
import { getStoreSettings, updateStoreSettings } from "@/lib/store-settings";

const BUCKET_NAME = "product-images";

function getAdminTokenFromRequest(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${getAdminSessionCookieName()}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

export async function POST(request: Request) {
  try {
    // 1. Admin Authentication Check
    const token = getAdminTokenFromRequest(request);
    const valid = await verifyAdminSession(token);

    if (!valid) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    // 2. Parse payload (supports JSON Base64 and FormData robustly)
    let buffer: Buffer | null = null;
    let fileType: string = "image/png";
    let fileName: string = "signature.png";

    const rawText = await request.text();

    if (rawText && rawText.trim().startsWith("{")) {
      try {
        const jsonBody = JSON.parse(rawText.trim());
        const fileData = jsonBody?.fileData || jsonBody?.base64 || jsonBody?.image || jsonBody?.signature;
        if (fileData && typeof fileData === "string") {
          fileName = jsonBody.fileName || "signature.png";
          const ext = (fileName.split(".").pop() || "").toLowerCase();
          
          let rawType = (jsonBody.fileType || "").toLowerCase().trim();
          if (!rawType || rawType === "application/octet-stream") {
            if (ext === "png") rawType = "image/png";
            else if (ext === "jpg" || ext === "jpeg") rawType = "image/jpeg";
            else if (ext === "webp") rawType = "image/webp";
            else if (ext === "svg") rawType = "image/svg+xml";
            else rawType = "image/png";
          }
          fileType = rawType;

          const base64Index = fileData.indexOf(";base64,");
          const cleanBase64 = base64Index !== -1 ? fileData.slice(base64Index + 8) : fileData.replace(/^data:[^;]+;base64,/, "");
          buffer = Buffer.from(cleanBase64, "base64");
        }
      } catch (jsonErr) {
        console.warn("JSON parse notice:", jsonErr);
      }
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json(
        { error: "Please select or provide a valid signature image file." },
        { status: 400 }
      );
    }

    // 3. Validate Allowed MIME Types (PNG, JPG, WebP, SVG)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/pjpeg",
      "image/png",
      "image/x-png",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(fileType)) {
      // Default to image/png if it looks like an image
      fileType = "image/png";
    }

    // 4. Validate File Size (Maximum 5 MB)
    const maxFileSize = 5 * 1024 * 1024;
    if (buffer.length > maxFileSize) {
      return NextResponse.json(
        { error: "Signature image size must be 5 MB or smaller." },
        { status: 400 }
      );
    }

    // 5. Generate Unique Storage Path
    const extension = fileName.split(".").pop()?.toLowerCase() || "png";
    const uniqueFileName = `signature-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
    const filePath = `invoice/signature/${uniqueFileName}`;

    // 6. Upload to Supabase Storage
    const { error: uploadError } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: fileType,
        upsert: true,
      });

    if (uploadError) {
      console.error("SUPABASE SIGNATURE UPLOAD ERROR:", uploadError);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 7. Get Public URL
    const { data: publicUrlData } = supabaseServer.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) {
      return NextResponse.json(
        { error: "Uploaded successfully but could not generate public URL." },
        { status: 500 }
      );
    }

    // 8. Safely Update Store Settings in Database
    const currentSettings = await getStoreSettings();
    const oldUrl = currentSettings.invoiceOwnerSignatureUrl;

    await updateStoreSettings({
      invoiceOwnerSignatureUrl: publicUrl,
    });

    // 9. Clean up old signature file if it was in our bucket
    if (oldUrl && typeof oldUrl === "string" && oldUrl.includes("/invoice/signature/")) {
      try {
        const oldPath = oldUrl.split(`/${BUCKET_NAME}/`)[1];
        if (oldPath && oldPath !== filePath) {
          await supabaseServer.storage.from(BUCKET_NAME).remove([oldPath]);
        }
      } catch (cleanupErr) {
        console.warn("Non-fatal old signature cleanup notice:", cleanupErr);
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
      message: "Owner signature uploaded and saved permanently in database.",
    });
  } catch (error) {
    console.error("ADMIN SIGNATURE UPLOAD EXCEPTION:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload signature.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // 1. Admin Authentication Check
    const token = getAdminTokenFromRequest(request);
    const valid = await verifyAdminSession(token);

    if (!valid) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    // 2. Load current settings & find signature
    const currentSettings = await getStoreSettings();
    const currentUrl = currentSettings.invoiceOwnerSignatureUrl;

    if (currentUrl && typeof currentUrl === "string" && currentUrl.includes(`/${BUCKET_NAME}/`)) {
      const storagePath = currentUrl.split(`/${BUCKET_NAME}/`)[1];
      if (storagePath) {
        try {
          await supabaseServer.storage.from(BUCKET_NAME).remove([storagePath]);
        } catch (removeErr) {
          console.warn("Storage deletion notice:", removeErr);
        }
      }
    }

    // 3. Update settings to clear signature reference permanently in database
    await updateStoreSettings({
      invoiceOwnerSignatureUrl: null,
    });

    return NextResponse.json({
      success: true,
      message: "Owner signature deleted successfully.",
    });
  } catch (error) {
    console.error("ADMIN SIGNATURE DELETE EXCEPTION:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete signature.",
      },
      { status: 500 }
    );
  }
}
