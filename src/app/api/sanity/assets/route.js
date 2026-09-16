import { NextResponse } from "next/server";
import { getSanityWriteClient } from "@/lib/sanity/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const assetType = (formData.get("assetType") || "image").toString().toLowerCase();

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    const client = getSanityWriteClient();

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name || "upload";
    const contentTypeHeader = file.type || "application/octet-stream";

    let asset;

    if (assetType === "image" || IMAGE_MIME_TYPES.has(contentTypeHeader)) {
      asset = await client.assets.upload("image", buffer, {
        filename,
        contentType: contentTypeHeader,
      });
    } else {
      asset = await client.assets.upload("file", buffer, {
        filename,
        contentType: contentTypeHeader,
      });
    }

    const isImage = asset._type === "sanity.imageAsset";

    return NextResponse.json({
      success: true,
      asset: {
        _id: asset._id,
        _type: asset._type,
        url: asset.url,
        originalFilename: asset.originalFilename,
        mimeType: asset.mimeType,
        size: asset.size,
        extension: asset.extension,
        ...(isImage && asset.metadata
          ? {
              dimensions: asset.metadata.dimensions,
              hasAlpha: asset.metadata.hasAlpha,
              isOpaque: asset.metadata.isOpaque,
            }
          : {}),
        reference: {
          _type: "reference",
          _ref: asset._id,
        },
        // Ready-to-use field snippets
        imageField: isImage
          ? {
              _type: "image",
              asset: {
                _type: "reference",
                _ref: asset._id,
              },
            }
          : null,
        fileField: !isImage
          ? {
              _type: "file",
              asset: {
                _type: "reference",
                _ref: asset._id,
              },
            }
          : null,
      },
    });
  } catch (err) {
    console.error("[assets upload]", err?.message || err);

    const message =
      err?.statusCode === 401 || err?.message?.includes("token")
        ? "Unauthorized – check SANITY_API_WRITE_TOKEN"
        : err?.message || "Upload failed";

    return NextResponse.json(
      { error: message, details: process.env.NODE_ENV === "development" ? String(err) : undefined },
      { status: err?.statusCode || 500 }
    );
  }
}
