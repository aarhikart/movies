import { NextRequest, NextResponse } from "next/server";
import { recordMovieDownload } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title, quality, fileSize, url } = body;

    // Extract client IP
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = (forwarded ? forwarded.split(",")[0].trim() : realIp) || "unknown";

    const { totalDownloads } = await recordMovieDownload({
      title: title || "Movie",
      quality: quality || "HD",
      fileSize: fileSize || "",
      url: url || "",
      ip,
    });

    return NextResponse.json({ success: true, totalDownloads });
  } catch (error: any) {
    console.error("POST /api/downloads/record error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
