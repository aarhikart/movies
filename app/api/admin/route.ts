import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { html } = await request.json();
    if (!html) {
      return NextResponse.json({ error: 'No HTML provided' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'app', 'movies.json');
    let existingMovies: any[] = [];
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      existingMovies = JSON.parse(fileContents);
    } catch (e) {
      existingMovies = []; // If file doesn't exist, start fresh
    }

    const normalizeTitle = (t: string) => t.trim().replace(/\s+/g, ' ').toLowerCase();

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
