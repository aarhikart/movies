export type Movie = {
  id: string;
  title: string;
  image: string;
  rating: string;
  genre: string;
  year?: string;
  duration?: string;
  releaseDate?: string;
  starcast?: string;
  overview?: string;
  quality?: string;
  type?: 'popular' | 'trending' | 'hero';
};

export const movies: Movie[] = [
  {
    id: "1",
    title: "Mission: Impossible — Dead Reckoning",
    image: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800&q=80",
    rating: "7.9/10",
    genre: "Action",
    duration: "2 Hrs 43 Mins",
    releaseDate: "12 Jul 2023",
    starcast: "Tom Cruise, Hayley Atwell, Ving Rhames",
    overview: "Ethan Hunt and his IMF team embark on their most dangerous mission yet: To track down a terrifying new weapon that threatens all of humanity before it falls into the wrong hands.",
    quality: "HDTC",
    type: "hero"
  },
  {
    id: "2",
    title: "Top Gun Maverick",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80",
    rating: "8.3",
    genre: "Action",
    type: "popular"
  },
  {
    id: "3",
    title: "Glass Onion: A Knives Out Mystery",
    image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=500&q=80",
    rating: "7.2",
    genre: "Mystery / Crime",
    type: "popular"
  },
  {
    id: "4",
    title: "The Man from Toronto",
    image: "https://images.unsplash.com/photo-1585951237318-9ea5e175b891?w=500&q=80",
    rating: "6.8",
    genre: "Action / Comedy",
    type: "popular"
  },
  {
    id: "5",
    title: "The Equalizer 3",
    image: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=500&q=80",
    rating: "7.5",
    genre: "Action / Thriller",
    type: "trending"
  },
  {
    id: "6",
    title: "Spider-Verse",
    image: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=500&q=80",
    rating: "8.7",
    genre: "Animation",
    type: "trending"
  },
  {
    id: "7",
    title: "Oppenheimer",
    image: "https://images.unsplash.com/photo-1682687982501-1e5898cb8f4b?w=500&q=80",
    rating: "8.6",
    genre: "Drama / Biography",
    type: "trending"
  },
  {
    id: "8",
    title: "Mirzapur The Movie (2026) Hindi Movie",
    image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&q=80",
    rating: "8.8/10",
    genre: "Crime, Action, Thriller, Drama",
    year: "2026",
    duration: "2 Hrs 58 Mins",
    releaseDate: "04 Sep 2026",
    starcast: "Pankaj Tripathi, Ali Fazal, Divyendu Sharma",
    overview: "Kaleen Bhaiya returns alongside Guddu Pandit in an explosive high-stakes battle for dominance. Directed for supreme theatrical intensity with crisp cinematic sound design.",
    quality: "HDTC",
    type: "hero"
  }
];
