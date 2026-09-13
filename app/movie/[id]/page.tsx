import type { Metadata } from "next";
import MovieMelaClient from "../../MovieMelaClient";
import { getMovieById } from "@/lib/movieHelper";
import { headers } from "next/headers";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  let headerList;
  try {
    headerList = await headers();
  } catch (_) {}

  const host = headerList?.get("x-forwarded-host") || headerList?.get("host") || "localhost:3000";
  const proto = headerList?.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;

  const movie = getMovieById(id);
  if (movie) {
    const title = movie.title || "Movie Details";
    const description = movie.overview
      ? `${movie.overview.slice(0, 160)}... Watch now on MovieMela in Full HD!`
      : `Watch ${title} on MovieMela in Full HD. Stream and download free!`;
    const imageUrl = movie.image || `${siteUrl}/favicon.ico`;
    const movieUrl = `${siteUrl}/movie/${encodeURIComponent(id)}`;

    return {
      title: `${title} - MovieMela`,
      description,
      openGraph: {
        title: title,
        description,
        url: movieUrl,
        siteName: "MovieMela",
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 1200,
            alt: title,
          },
        ],
        type: "video.movie",
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description,
        images: [imageUrl],
      },
    };
  }

  return {
    title: "MovieMela - Watch & Download Free Movies in HD",
    description: "Watch latest Bollywood, South, Hollywood & Web Series in HD quality on MovieMela.",
    openGraph: {
      title: "MovieMela - Watch & Download Free Movies in HD",
      description: "Watch latest Bollywood, South, Hollywood & Web Series in HD quality on MovieMela.",
      siteName: "MovieMela",
    },
  };
}

export default async function MoviePage({ params }: Props) {
  const { id } = await params;
  return <MovieMelaClient initialMovieId={id} />;
}
