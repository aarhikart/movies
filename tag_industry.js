const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'movies.json');
const movies = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let updatedCount = 0;

movies.forEach(movie => {
  let textToSearch = movie.title + " " + movie.downloadLinks.map(l => l.label).join(" ") + " " + (movie.genre || "");
  textToSearch = textToSearch.toLowerCase();
  
  let industry = 'Unknown';
  
  // Checking specific industries based on keywords
  if (textToSearch.includes('telugu') || textToSearch.includes('tollywood')) {
    industry = 'Tollywood';
  } else if (textToSearch.includes('tamil') || textToSearch.includes('kollywood')) {
    industry = 'Kollywood';
  } else if (textToSearch.includes('malayalam') || textToSearch.includes('mollywood')) {
    industry = 'Mollywood';
  } else if (textToSearch.includes('kannada') || textToSearch.includes('sandalwood')) {
    industry = 'Sandalwood';
  } else if (textToSearch.includes('marathi')) {
    industry = 'Marathi';
  } else if (textToSearch.includes('punjabi')) {
    industry = 'Punjabi';
  } else if (textToSearch.includes('bhojpuri')) {
    industry = 'Bhojpuri';
  } else if (textToSearch.includes('south indian') || textToSearch.includes('south hindi dubbed')) {
    industry = 'South Indian'; // General fallback for dubbed south movies
  } else if (textToSearch.includes('hollywood') || textToSearch.includes('english') || textToSearch.includes('dual audio')) {
    industry = 'Hollywood'; // General fallback for english/dubbed western movies
  } else if (textToSearch.includes('hindi') || textToSearch.includes('bollywood')) {
    industry = 'Bollywood';
  } else {
    // If we can't find anything, try to guess
    if (textToSearch.includes('series') || textToSearch.includes('season')) {
      industry = 'Web Series'; // Generic category for series
    } else {
      industry = 'Bollywood'; // Safe default for an Indian piracy site
    }
  }

  movie.industry = industry;
  updatedCount++;
});

fs.writeFileSync(filePath, JSON.stringify(movies, null, 2));
console.log(`Successfully added 'industry' field to ${updatedCount} movies!`);
