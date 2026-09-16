import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { WebSeriesShow, parseDateToTimestamp, getYearFromDate } from '@/lib/movieHelper';

function getSeriesDate(s: WebSeriesShow): string {
  return s.releaseDate || s.seasons?.[0]?.episodes?.[0]?.airDate || '';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '24', 10));
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim().toLowerCase();
    const category = (searchParams.get('category') || '').trim();
    const year = (searchParams.get('year') || '').trim();
    const id = (searchParams.get('id') || '').trim();
    const tmdbId = (searchParams.get('tmdbId') || '').trim();

    const filePath = path.join(process.cwd(), 'app', 'web_series.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
        categories: ["All", "Hindi Web Series"],
        years: ["All", "2026", "2024"]
      });
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    let seriesList: WebSeriesShow[] = JSON.parse(fileContents);

    // Sort chronologically descending: newest release / air date first
    seriesList.sort((a, b) => {
      const dateA = getSeriesDate(a);
      const dateB = getSeriesDate(b);
      return parseDateToTimestamp(dateB, b.title) - parseDateToTimestamp(dateA, a.title);
    });

    // Single item query
    if (id || tmdbId) {
      const found = seriesList.find(s => 
        (id && (s.id === id || s.tmdbId === id)) || 
        (tmdbId && s.tmdbId === tmdbId)
      );
      if (found) {
        return NextResponse.json({ success: true, series: found });
      } else {
        return NextResponse.json({ success: false, error: "Series not found" }, { status: 404 });
      }
    }

    // Extract categories
    const categoriesSet = new Set<string>();
    seriesList.forEach(s => {
      if (s.category) categoriesSet.add(s.category);
      if (s.genre) categoriesSet.add(s.genre);
    });
    const categories = Array.from(categoriesSet);

    // Extract available years
    const rawYears = Array.from(new Set(seriesList.map(s => getYearFromDate(getSeriesDate(s), s.title)).filter(Boolean)));
    const years = ["All", ...rawYears.sort((a, b) => Number(b) - Number(a))];

    // Filter by category
    if (category && category.toLowerCase() !== 'all') {
      seriesList = seriesList.filter(s => 
        (s.category && s.category.toLowerCase() === category.toLowerCase()) ||
        (s.genre && s.genre.toLowerCase() === category.toLowerCase())
      );
    }

    // Filter by year
    if (year && year !== 'All') {
      seriesList = seriesList.filter(s => getYearFromDate(getSeriesDate(s), s.title) === year);
    }

    // Search query filter
    if (search) {
      seriesList = seriesList.filter(s => {
        const titleMatch = s.title.toLowerCase().includes(search);
        const overviewMatch = s.overview?.toLowerCase().includes(search);
        const epMatch = s.seasons?.some(season => 
          season.episodes?.some(ep => ep.title.toLowerCase().includes(search) || ep.overview?.toLowerCase().includes(search))
        );
        return titleMatch || overviewMatch || epMatch;
      });
    }

    const total = seriesList.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedSeries = seriesList.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedSeries,
      total,
      page,
      limit,
      totalPages,
      categories,
      years
    });
  } catch (error: any) {
    console.error("GET /api/web-series error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load web series" },
      { status: 500 }
    );
  }
}
