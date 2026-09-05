const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('app/data.html', 'utf8');
const $ = cheerio.load(html);

const movies = [];

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

  const downloadLinks = [];
  $(el).find('.dl-list li a').each((_, a) => {
    downloadLinks.push({
      label: $(a).text().trim(),
      url: $(a).attr('href')
    });
  });
  
  // Calculate a fake rating for UI purposes
  const rating = (Math.random() * 2 + 7).toFixed(1) + "/10";

  movies.push({
    id: String(i + 1),
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
    type: i < 5 ? 'hero' : (i < 15 ? 'popular' : 'trending')
  });
});

fs.writeFileSync('app/movies.json', JSON.stringify(movies, null, 2));
console.log('Parsed', movies.length, 'movies and saved to app/movies.json');
