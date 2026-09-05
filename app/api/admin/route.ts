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
    let existingMovies = [];
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      existingMovies = JSON.parse(fileContents);
    } catch (e) {
      existingMovies = []; // If file doesn't exist, start fresh
    }

    const existingTitles = new Set(existingMovies.map((m: any) => m.title.trim().toLowerCase()));
    
    const $ = cheerio.load(html);
    const newMovies: any[] = [];
    
    $('.card').each((i, el) => {
      const poster = $(el).find('.poster-box img').attr('src');
      
      let title = '', starcast = '', genres = '', quality = '', duration = '', releaseDate = '', overview = '';
      
      $(el).find('.row').each((_, row) => {
        const label = $(row).find('.label').text().trim();
        const val = $(row).find('.val-blue, .val-green').text().trim();
        
        if (label.includes('Movie Name')) title = val;
        if (label.includes('Starcast')) starcast = val;
        if (label.includes('Genres')) genres = val;
        if (label.includes('Quality')) quality = val;
        if (label.includes('Length')) duration = val;
        if (label.includes('Release Date')) releaseDate = val;
        if (label.includes('Movie Story')) overview = val;
      });

      const downloadLinks: any[] = [];
      $(el).find('.dl-list li a').each((_, a) => {
        downloadLinks.push({
          label: $(a).text().trim(),
          url: $(a).attr('href')
        });
      });
      
      // Skip if title already exists in our database
      if (!title || existingTitles.has(title.trim().toLowerCase())) {
        return; 
      }
      
      const rating = (Math.random() * 2 + 7).toFixed(1) + "/10";
      
      // Keep ID sequence going
      const newId = String(existingMovies.length + newMovies.length + 1);

      newMovies.push({
        id: newId,
        title,
        image: poster,
        rating,
        genre: genres,
        duration: duration === 'N/A' ? '' : duration,
        releaseDate,
        starcast,
        overview,
        quality,
        downloadLinks,
        type: 'popular' // default category for newly scraped movies
      });
      
      // Add to set so we don't duplicate within the pasted HTML itself
      existingTitles.add(title.trim().toLowerCase());
    });

    if (newMovies.length > 0) {
      // Prepend or append new movies. Let's put them at the top so they show up first!
      const updatedMovies = [...newMovies, ...existingMovies];
      fs.writeFileSync(filePath, JSON.stringify(updatedMovies, null, 2));
    }

    return NextResponse.json({ 
      success: true, 
      addedCount: newMovies.length,
      newMovies: newMovies
    });

  } catch (error: any) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
