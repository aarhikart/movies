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

    // Read total original movies in JSON database
    let totalOriginalMovies = 0;
    try {
      const origFilePath = path.join(process.cwd(), "app", "original_movies.json");
      if (fs.existsSync(origFilePath)) {
        const origData = JSON.parse(fs.readFileSync(origFilePath, "utf-8"));
        totalOriginalMovies = Array.isArray(origData) ? origData.length : 0;
      }
    } catch (e) {}

    // Read total web series and episodes in JSON database
    let totalWebSeries = 0;
    let totalWebSeriesEpisodes = 0;
    try {
      const seriesFilePath = path.join(process.cwd(), "app", "web_series.json");
      if (fs.existsSync(seriesFilePath)) {
        const seriesData = JSON.parse(fs.readFileSync(seriesFilePath, "utf-8"));
        if (Array.isArray(seriesData)) {
          totalWebSeries = seriesData.length;
          totalWebSeriesEpisodes = seriesData.reduce((sum: number, s: any) => sum + (s.totalEpisodes || 0), 0);
        }
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      ...stats,
      totalMoviesInCatalog: totalMovies,
      totalOriginalMoviesInCatalog: totalOriginalMovies,
      totalWebSeriesInCatalog: totalWebSeries,
      totalWebSeriesEpisodes: totalWebSeriesEpisodes,
    });
  } catch (error: any) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
