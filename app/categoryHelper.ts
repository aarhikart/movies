export function getFilterForCategory(rawCategory?: string): string {
  if (!rawCategory) return '';
  const norm = rawCategory.trim().toLowerCase();

  // 1. Bollywood: Bollywood Hindi, Bollywood Hindi Old, Bollywood
  if (norm === 'bollywood' || norm === 'bollywood hindi' || norm === 'bollywood hindi old') {
    return 'Bollywood';
  }

  // 2. Gujrati: Gujarati Movies, Gujrati
  if (norm === 'gujrati' || norm === 'gujarati movies' || norm === 'gujarati movie') {
    return 'Gujrati';
  }

  // 3. Hindi Dubbed: Hindi Dubbed Series, Hindi Dubbed
  if (norm === 'hindi dubbed' || norm === 'hindi dubbed series') {
    return 'Hindi Dubbed';
  }

  // 4. Hindi web Series: Hindi web Series, Hindi Web Series, Web Series Hindi Dubbed
  if (norm === 'hindi web series' || norm === 'web series hindi dubbed') {
    return 'Hindi web Series';
  }

  // 5. Hollywood: Hollywood English, Hollywood
  if (norm === 'hollywood' || norm === 'hollywood english') {
    return 'Hollywood';
  }

  // 6. Hollywood Hindi: Hollywood Hindi Dubbed, Hollywood Hindi
  if (norm === 'hollywood hindi' || norm === 'hollywood hindi dubbed') {
    return 'Hollywood Hindi';
  }

  // 7. Marathi: Marathi Movie, Marathi Movies, Marathi
  if (norm === 'marathi' || norm === 'marathi movie' || norm === 'marathi movies') {
    return 'Marathi';
  }

  // 8. Panjabi: Punjabi Movie, Punjabi Movies, Panjabi
  if (norm === 'panjabi' || norm === 'punjabi' || norm === 'punjabi movie' || norm === 'punjabi movies') {
    return 'Panjabi';
  }

  // 9. South Indian Hindi: South Indian Hindi Dubbed, South Indian Hindi
  if (norm === 'south indian hindi' || norm === 'south indian hindi dubbed') {
    return 'South Indian Hindi';
  }

  // 10. TV Shows: Tv Shows, TV Shows
  if (norm === 'tv shows' || norm === 'tv show') {
    return 'TV Shows';
  }

  return rawCategory.trim();
}
