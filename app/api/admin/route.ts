import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const langMap: Record<string, string> = {
  HI: 'Hindi',
  ML: 'Malayalam',
  TA: 'Tamil',
  TE: 'Telugu',
  KN: 'Kannada',
  BN: 'Bengali',
  MR: 'Marathi',
  PA: 'Punjabi',
  GU: 'Gujarati',
  EN: 'English',
  KO: 'Korean',
  JA: 'Japanese',
  ZH: 'Chinese',
  ES: 'Spanish',
  FR: 'French',
  DE: 'German',
  IT: 'Italian',
  RU: 'Russian'
};

export async function POST(request: Request) {
  try {
    const { html, catalog = 'dubbed' } = await request.json();
    if (!html) {
      return NextResponse.json({ error: 'No HTML provided' }, { status: 400 });
    }

    const normalizeTitle = (t: string) => t.trim().replace(/\s+/g, ' ').toLowerCase();

    // ==========================================
    // CATALOG 1: ORIGINAL MOVIES (TABLE ROWS)
    // ==========================================
    if (catalog === 'original') {
      const filePath = path.join(process.cwd(), 'app', 'original_movies.json');
      let existingMovies: any[] = [];
      try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        existingMovies = JSON.parse(fileContents);
      } catch (e) {
        existingMovies = [];
      }

      const cleanHtml = html.includes('<table') ? html : `<table><tbody>${html}</tbody></table>`;
      const $ = cheerio.load(cleanHtml);
      const newMovies: any[] = [];
      const titlesUpdated = new Set<string>();
      const titlesAdded = new Set<string>();

      $('tr').each((i, el) => {
        const tds = $(el).find('td');
        if (tds.length < 5) return;

        const poster = $(el).find('img').attr('src') || '';
        const title = $(el).find('strong').text().trim() || $(tds[2]).text().trim();
        if (!title) return;

        const overview = $(tds[3]).text().replace(/\s+/g, ' ').trim();
        const releaseDate = $(tds[4]).text().trim();
        const langCode = $(el).find('.badge-tag').text().trim().toUpperCase() || $(tds[5]).text().trim().toUpperCase();
        const language = langMap[langCode] || langCode || 'Original';
        const country = $(el).find('.badge-country').text().trim() || $(tds[6]).text().trim();
        const duration = $(tds[7]).text().trim();
        const rawRating = $(tds[8]).text().replace(/⭐|\*/g, '').trim();
        const rating = rawRating && rawRating !== 'NR' ? rawRating : '';

        const playLink = $(el).find('a').attr('href') || '';
        const tmdbIdMatch = playLink.match(/\/movie\/(\d+)/i) || playLink.match(/(\d+)/);
        const tmdbId = tmdbIdMatch ? tmdbIdMatch[1] : '';

        const nightflixWatchUrl = tmdbId ? `https://nightflix.vg/watch/movie/${tmdbId}` : playLink;
        const vidsuEmbedUrl = tmdbId ? `https://player-4aq.pages.dev/embed/movie/${tmdbId}?autoPlay=true` : '';
        const vidlinkEmbedUrl = tmdbId ? `https://vidlink.pro/movie/${tmdbId}?autoplay=true` : '';
        const vidmeEmbedUrl = tmdbId ? `https://vidzen.fun/movie/${tmdbId}?autoPlay=true` : '';
        const vidcoreEmbedUrl = tmdbId ? `https://vidcore.net/movie/${tmdbId}?autoPlay=true` : '';
        const autoembedUrl = tmdbId ? `https://player.autoembed.cc/embed/movie/${tmdbId}` : '';
        const vidruEmbedUrl = tmdbId ? `https://ythd.org/embed/${tmdbId}?autoPlay=true` : '';

        const normalized = normalizeTitle(title);

        // Check if already in batch
        const batchIndex = newMovies.findIndex((m: any) => m.title && normalizeTitle(m.title) === normalized);
        if (batchIndex !== -1) {
          newMovies.splice(batchIndex, 1);
        }

        // Check if existing in catalog
        const existingMatch = existingMovies.find((m: any) => 
          (m.tmdbId && tmdbId && m.tmdbId === tmdbId) || 
          (m.title && normalizeTitle(m.title) === normalized)
        );

        let movieId = tmdbId ? `orig_${tmdbId}` : `orig_${Date.now()}_${i}`;

        if (existingMatch) {
          movieId = existingMatch.id;
          existingMovies = existingMovies.filter((m: any) => 
            !(m.tmdbId && tmdbId && m.tmdbId === tmdbId) && 
            (!m.title || normalizeTitle(m.title) !== normalized)
          );
          titlesUpdated.add(normalized);
        } else {
          titlesAdded.add(normalized);
        }

        newMovies.push({
          id: movieId,
          tmdbId: tmdbId || existingMatch?.tmdbId || '',
          title,
          image: poster || existingMatch?.image || '',
          overview: overview || existingMatch?.overview || '',
          releaseDate: releaseDate || existingMatch?.releaseDate || '',
          languageCode: langCode || existingMatch?.languageCode || '',
          category: language || existingMatch?.category || 'Original',
          genre: `${language} Cinema`,
          country: country || existingMatch?.country || '',
          duration: duration || existingMatch?.duration || '',
          rating: rating || existingMatch?.rating || '',
          playUrl: playLink || existingMatch?.playUrl || '',
          watchUrl: nightflixWatchUrl || existingMatch?.watchUrl || '',
          isOriginal: true,
          streamServers: [
            { name: "Vidsu (AdFree)", url: vidsuEmbedUrl },
            { name: "VidLink (Clean HD)", url: vidlinkEmbedUrl },
            { name: "Vidme Fast", url: vidmeEmbedUrl },
            { name: "Vidcore HD", url: vidcoreEmbedUrl },
            { name: "AutoEmbed CC", url: autoembedUrl },
            { name: "Vidru Direct", url: vidruEmbedUrl },
            { name: "Nightflix Official", url: nightflixWatchUrl }
          ].filter(s => s.url)
        });
      });

      if (newMovies.length > 0) {
        const updatedMovies = [...newMovies, ...existingMovies];
        fs.writeFileSync(filePath, JSON.stringify(updatedMovies, null, 2));
      }

      return NextResponse.json({
        success: true,
        catalog: 'original',
        addedCount: titlesAdded.size,
        updatedCount: titlesUpdated.size,
        totalProcessed: newMovies.length,
        totalInCatalog: newMovies.length + existingMovies.length,
        newMovies
      });
    }

    // ==========================================
    // CATALOG 2: WEB SERIES (EPISODIC ROWS)
    // ==========================================
    if (catalog === 'web_series') {
      const filePath = path.join(process.cwd(), 'app', 'web_series.json');
      let existingSeries: any[] = [];
      try {
        if (fs.existsSync(filePath)) {
          const fileContents = fs.readFileSync(filePath, 'utf8');
          existingSeries = JSON.parse(fileContents);
        }
      } catch (e) {
        existingSeries = [];
      }

      const cleanHtml = html.includes('<table') ? html : `<table><tbody>${html}</tbody></table>`;
      const $ = cheerio.load(cleanHtml);
      const batchShowsMap = new Map<string, any>();
      let totalEpisodesProcessed = 0;

      $('tr').each((i, el) => {
        const tds = $(el).find('td');
        if (tds.length < 5) return;

        const thumbnail = $(el).find('img').attr('src') || '';
        const titleTd = $(tds[2]);
        const showTitle = titleTd.find('strong').text().trim() || titleTd.text().trim();
        if (!showTitle) return;

        const idText = titleTd.text();
        const tmdbIdMatch = idText.match(/ID:\s*(\d+)/i) || $(el).find('a').attr('href')?.match(/\/tv\/(\d+)/i);
        const tmdbId = tmdbIdMatch ? tmdbIdMatch[1] : '';

        const seasonText = $(tds[3]).find('.badge-season').text().trim() || $(tds[3]).text();
        const epText = $(tds[3]).find('.badge-ep').text().trim() || $(tds[3]).text();
        const seasonMatch = seasonText.match(/S(\d+)/i);
        const episodeMatch = epText.match(/E(\d+)/i);

        const seasonNum = seasonMatch ? parseInt(seasonMatch[1], 10) : 1;
        const epNum = episodeMatch ? parseInt(episodeMatch[1], 10) : (i + 1);

        const episodeTitle = $(tds[4]).find('strong').text().trim() || $(tds[4]).text().trim() || `Episode ${epNum}`;
        const overview = $(tds[5]).text().replace(/\s+/g, ' ').trim();
        const airDate = $(tds[6]).text().trim();
        const duration = $(tds[7]).text().trim();
        const rawRating = $(tds[8]).text().replace(/⭐|\*/g, '').trim();
        const rating = rawRating && rawRating !== 'NR' ? rawRating : '';

        let vidcoreUrl = '';
        let nightflixUrl = '';
        $(tds[9]).find('a').each((_, a) => {
          const href = $(a).attr('href') || '';
          if (href.includes('vidcore')) vidcoreUrl = href;
          if (href.includes('nightflix')) nightflixUrl = href;
        });

        const vidcoreEmbedUrl = (tmdbId ? `https://vidcore.io/tv/${tmdbId}/${seasonNum}/${epNum}?autoPlay=true` : '') || vidcoreUrl;
        const vidlinkEmbedUrl = tmdbId ? `https://vidlink.pro/tv/${tmdbId}/${seasonNum}/${epNum}?autoplay=true` : '';
        const vidmeEmbedUrl = tmdbId ? `https://vidzen.fun/tv/${tmdbId}/${seasonNum}/${epNum}?autoPlay=true` : '';
        const autoembedUrl = tmdbId ? `https://player.autoembed.cc/embed/tv/${tmdbId}/${seasonNum}/${epNum}` : '';

        const showKey = tmdbId || normalizeTitle(showTitle);
        if (!batchShowsMap.has(showKey)) {
          batchShowsMap.set(showKey, {
            id: tmdbId ? `series_${tmdbId}` : `series_${Date.now()}_${i}`,
            tmdbId,
            title: showTitle,
            poster: thumbnail,
            overview: overview,
            category: "Hindi Web Series",
            genre: "Hindi Web Series",
            rating: rating,
            seasonsMap: new Map<number, any>()
          });
        }

        const show = batchShowsMap.get(showKey);
        if (!show.rating && rating) show.rating = rating;
        if (!show.poster && thumbnail) show.poster = thumbnail;

        if (!show.seasonsMap.has(seasonNum)) {
          show.seasonsMap.set(seasonNum, {
            seasonNumber: seasonNum,
            name: `Season ${seasonNum}`,
            episodesMap: new Map<number, any>()
          });
        }

        const season = show.seasonsMap.get(seasonNum);
        season.episodesMap.set(epNum, {
          episodeNumber: epNum,
          title: episodeTitle,
          thumbnail: thumbnail,
          overview: overview,
          airDate: airDate,
          duration: duration,
          rating: rating,
          streamUrl: vidcoreEmbedUrl || vidlinkEmbedUrl,
          nightflixUrl: nightflixUrl,
          streamServers: [
            { name: "Vidcore Direct", url: vidcoreEmbedUrl },
            { name: "VidLink (Clean HD)", url: vidlinkEmbedUrl },
            { name: "Vidme Fast", url: vidmeEmbedUrl },
            { name: "AutoEmbed CC", url: autoembedUrl },
            { name: "Nightflix Official", url: nightflixUrl }
          ].filter(s => s.url)
        });

        totalEpisodesProcessed++;
      });

      let addedShowsCount = 0;
      let updatedShowsCount = 0;

      // Process batch into merged array
      for (const [key, batchShow] of batchShowsMap.entries()) {
        const existingIdx = existingSeries.findIndex((s: any) => 
          (s.tmdbId && batchShow.tmdbId && s.tmdbId === batchShow.tmdbId) ||
          (s.title && normalizeTitle(s.title) === normalizeTitle(batchShow.title))
        );

        let targetShow: any;
        if (existingIdx !== -1) {
          // Existing show found: merge
          targetShow = existingSeries[existingIdx];
          existingSeries.splice(existingIdx, 1);
          updatedShowsCount++;
        } else {
          // New show
          targetShow = {
            id: batchShow.id,
            tmdbId: batchShow.tmdbId,
            title: batchShow.title,
            poster: batchShow.poster,
            overview: batchShow.overview,
            category: batchShow.category,
            genre: batchShow.genre,
            rating: batchShow.rating,
            totalSeasons: 0,
            totalEpisodes: 0,
            seasons: []
          };
          addedShowsCount++;
        }

        // Merge seasons
        for (const [sNum, batchSeason] of batchShow.seasonsMap.entries()) {
          let sIdx = targetShow.seasons.findIndex((s: any) => s.seasonNumber === sNum);
          if (sIdx === -1) {
            targetShow.seasons.push({
              seasonNumber: sNum,
              name: batchSeason.name,
              episodeCount: 0,
              episodes: []
            });
            sIdx = targetShow.seasons.length - 1;
          }

          const existingSeason = targetShow.seasons[sIdx];
          for (const [epNum, epData] of batchSeason.episodesMap.entries()) {
            const epIdx = existingSeason.episodes.findIndex((e: any) => e.episodeNumber === epNum);
            if (epIdx !== -1) {
              existingSeason.episodes[epIdx] = epData;
            } else {
              existingSeason.episodes.push(epData);
            }
          }

          existingSeason.episodes.sort((a: any, b: any) => a.episodeNumber - b.episodeNumber);
          existingSeason.episodeCount = existingSeason.episodes.length;
        }

        // Sort seasons
        targetShow.seasons.sort((a: any, b: any) => a.seasonNumber - b.seasonNumber);
        targetShow.totalSeasons = targetShow.seasons.length;
        targetShow.totalEpisodes = targetShow.seasons.reduce((sum: number, s: any) => sum + (s.episodeCount || s.episodes?.length || 0), 0);

        if (batchShow.poster) targetShow.poster = batchShow.poster;
        if (batchShow.overview && !targetShow.overview) targetShow.overview = batchShow.overview;
        if (batchShow.rating) targetShow.rating = batchShow.rating;

        // Add to the top of existing series list
        existingSeries.unshift(targetShow);
      }

      if (batchShowsMap.size > 0) {
        fs.writeFileSync(filePath, JSON.stringify(existingSeries, null, 2), 'utf8');
      }

      return NextResponse.json({
        success: true,
        catalog: 'web_series',
        addedCount: addedShowsCount,
        updatedCount: updatedShowsCount,
        totalEpisodesProcessed,
        totalInCatalog: existingSeries.length
      });
    }

    // ==========================================
    // CATALOG 3: DUBBED MOVIES (CARDS)
    // ==========================================
    const filePath = path.join(process.cwd(), 'app', 'movies.json');
    let existingMovies: any[] = [];
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      existingMovies = JSON.parse(fileContents);
    } catch (e) {
      existingMovies = []; // If file doesn't exist, start fresh
    }

    let maxId = existingMovies.reduce((max: number, m: any) => Math.max(max, parseInt(m.id) || 0), 0);
    
    const $ = cheerio.load(html);
    const newMovies: any[] = [];
    const titlesUpdated = new Set<string>();
    const titlesAdded = new Set<string>();
    
    $('.card').each((i, el) => {
      const poster = $(el).find('.poster-box img').attr('src');
      
      let title = '', starcast = '', genres = '', quality = '', duration = '', releaseDate = '', overview = '', category = '';
      
      $(el).find('.row').each((_, row) => {
        const label = $(row).find('.label').text().trim();
        
        // Clone the row, strip the label, and retrieve the full text content
        const rowClone = $(row).clone();
        rowClone.find('.label').remove();
        let val = rowClone.text().replace(/\s+/g, ' ').trim();

        // Fallback to specific classes if empty
        if (!val) {
          val = $(row).find('.val-blue, .val-green, .val-orange, .artist, .green, font').text().replace(/\s+/g, ' ').trim();
        }
        
        if (/Movie Name/i.test(label)) title = val;
        else if (/Starcast/i.test(label)) starcast = val;
        else if (/Genres?/i.test(label)) genres = val;
        else if (/Quality/i.test(label)) quality = val;
        else if (/Length|Duration/i.test(label)) duration = val;
        else if (/Release Date/i.test(label)) releaseDate = val;
        else if (/Movie Story|Story|Overview|Plot|Synopsis/i.test(label)) overview = val;
        else if (/Category/i.test(label)) category = val;
      });

      // Fallback for overview (Movie Story) if outside standard .row structure
      if (!overview) {
        $(el).find('div, p, span').each((_, elem) => {
          const t = $(elem).text();
          if (/Movie Story\s*:|Story\s*:/i.test(t)) {
            const parts = t.split(/Movie Story\s*:|Story\s*:/i);
            if (parts[1] && parts[1].trim()) {
              overview = parts[1].replace(/\s+/g, ' ').trim();
            }
          }
        });
      }

      // Extract download links (both inside .card and following sibling elements)
      const downloadLinks: any[] = [];
      $(el).find('.dl-list li a, a[href*="/server/"], a[href*="/dl/"]').each((_, a) => {
        const href = $(a).attr('href');
        const text = $(a).text().trim().replace(/^[»\s]+/, '');
        if (href) {
          downloadLinks.push({ label: text, url: href });
        }
      });

      // If links are placed outside .card as siblings before next .card
      if (downloadLinks.length === 0) {
        let nextEl = $(el).next();
        while (nextEl.length && !nextEl.hasClass('card')) {
          nextEl.find('.dl-list li a, a[href*="/server/"], a[href*="/dl/"]').each((_, a) => {
            const href = $(a).attr('href');
            const text = $(a).text().trim().replace(/^[»\s]+/, '');
            if (href) {
              downloadLinks.push({ label: text, url: href });
            }
          });
          if (nextEl.is('a[href*="/server/"]') || nextEl.is('a[href*="/dl/"]')) {
            const href = nextEl.attr('href');
            const text = nextEl.text().trim().replace(/^[»\s]+/, '');
            if (href) {
              downloadLinks.push({ label: text, url: href });
            }
          }
          nextEl = nextEl.next();
        }
      }
      
      if (!title || !title.trim()) {
        return; 
      }

      const normalized = normalizeTitle(title);

      // Check if this title was already added in the current batch; if so, remove previous one
      const batchIndex = newMovies.findIndex((m: any) => m.title && normalizeTitle(m.title) === normalized);
      if (batchIndex !== -1) {
        newMovies.splice(batchIndex, 1);
      }

      // Check if movie already exists in the database
      const existingMatch = existingMovies.find((m: any) => m.title && normalizeTitle(m.title) === normalized);
      
      let movieId = '';
      let rating = '';
      let movieType = 'popular';

      if (existingMatch) {
        // Replace existing movie: keep existing ID and rating
        movieId = existingMatch.id;
        rating = existingMatch.rating || ((Math.random() * 2 + 7).toFixed(1) + "/10");
        movieType = existingMatch.type || 'popular';

        // Remove old movie from existingMovies so it is replaced completely
        existingMovies = existingMovies.filter((m: any) => !m.title || normalizeTitle(m.title) !== normalized);
        titlesUpdated.add(normalized);
      } else {
        maxId++;
        movieId = String(maxId);
        rating = (Math.random() * 2 + 7).toFixed(1) + "/10";
        titlesAdded.add(normalized);
      }

      // Auto-identify industry
      let textToSearch = (title + " " + downloadLinks.map(l => l.label).join(" ") + " " + genres).toLowerCase();
      let industry = 'Unknown';
      if (textToSearch.includes('telugu') || textToSearch.includes('tollywood')) industry = 'Tollywood';
      else if (textToSearch.includes('tamil') || textToSearch.includes('kollywood')) industry = 'Kollywood';
      else if (textToSearch.includes('malayalam') || textToSearch.includes('mollywood')) industry = 'Mollywood';
      else if (textToSearch.includes('kannada') || textToSearch.includes('sandalwood')) industry = 'Sandalwood';
      else if (textToSearch.includes('marathi')) industry = 'Marathi';
      else if (textToSearch.includes('punjabi')) industry = 'Punjabi';
      else if (textToSearch.includes('bhojpuri')) industry = 'Bhojpuri';
      else if (textToSearch.includes('south indian') || textToSearch.includes('south hindi dubbed')) industry = 'South Indian';
      else if (textToSearch.includes('hollywood') || textToSearch.includes('english') || textToSearch.includes('dual audio')) industry = 'Hollywood';
      else if (textToSearch.includes('hindi') || textToSearch.includes('bollywood')) industry = 'Bollywood';
      else if (textToSearch.includes('series') || textToSearch.includes('season')) industry = 'Web Series';
      else industry = 'Bollywood'; // Safe default

      newMovies.push({
        id: movieId,
        title,
        image: poster || existingMatch?.image || '',
        rating,
        genre: genres || existingMatch?.genre || '',
        duration: (duration === 'N/A' || !duration) ? (existingMatch?.duration || '') : duration,
        releaseDate: releaseDate || existingMatch?.releaseDate || '',
        starcast: starcast || existingMatch?.starcast || '',
        overview: overview || existingMatch?.overview || '',
        quality: quality || existingMatch?.quality || '',
        downloadLinks: downloadLinks.length > 0 ? downloadLinks : (existingMatch?.downloadLinks || []),
        industry: industry !== 'Unknown' ? industry : (existingMatch?.industry || 'Bollywood'), 
        category: category || existingMatch?.category || '',
        type: movieType
      });
    });

    if (newMovies.length > 0) {
      // Prepend updated & new movies at the top so the latest version appears first
      const updatedMovies = [...newMovies, ...existingMovies];
      fs.writeFileSync(filePath, JSON.stringify(updatedMovies, null, 2));
    }

    return NextResponse.json({ 
      success: true, 
      addedCount: titlesAdded.size,
      updatedCount: titlesUpdated.size,
      totalProcessed: newMovies.length,
      newMovies: newMovies
    });

  } catch (error: any) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
