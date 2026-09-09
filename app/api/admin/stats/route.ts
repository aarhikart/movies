import { NextResponse } from "next/server";
import { getAdminDashboardStats } from "@/lib/mongodb";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const stats = await getAdminDashboardStats();

    // Read total movies in JSON database
    let totalMovies = 0;
    try {
      const filePath = path.join(process.cwd(), "app", "movies.json");
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        totalMovies = Array.isArray(data) ? data.length : 0;
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      ...stats,
      totalMoviesInCatalog: totalMovies,
    });
  } catch (error: any) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
