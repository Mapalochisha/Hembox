import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const uploadType = (formData.get("type") as string) || "product";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // For images, we use base64 data URI. For .txt files, we can upload the buffer directly or use base64.
    const isLegal = uploadType === "legal";
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Different settings for product images vs banners vs legal docs
    const isProduct = uploadType === "product";

    const result = await cloudinary.uploader.upload(base64, {
      folder: isLegal ? "hembox/legal" : (isProduct ? "hembox/products" : "hembox/banners"),
      resource_type: isLegal ? "raw" : "image",
      transformation: isLegal ? [] : (isProduct
        ? [
            { width: 1200, height: 1500, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ]
        : [
            { width: 2560, crop: "limit" },
            { quality: "auto:best" },
            { fetch_format: "auto" },
          ]),
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message ?? "Upload failed" }, { status: 500 });
  }
}