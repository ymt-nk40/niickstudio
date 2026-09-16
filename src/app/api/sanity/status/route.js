import { NextResponse } from "next/server";
import { getSanityReadClient } from "@/lib/sanity/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
    const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";
    const hasWriteToken = Boolean(process.env.SANITY_API_WRITE_TOKEN);

    if (!projectId || !dataset) {
      return NextResponse.json({
        connected: false,
        projectId: projectId || null,
        dataset: dataset || null,
        apiVersion,
        hasWriteToken,
        error: "Missing project ID or dataset",
      });
    }

    // Lightweight connectivity check
    const client = getSanityReadClient();
    await client.fetch("count(*)");

    return NextResponse.json({
      connected: true,
      projectId,
      dataset,
      apiVersion,
      hasWriteToken,
    });
  } catch (err) {
    return NextResponse.json({
      connected: false,
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || null,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || null,
      apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01",
      hasWriteToken: Boolean(process.env.SANITY_API_WRITE_TOKEN),
      error: err?.message || "Connection failed",
    });
  }
}
