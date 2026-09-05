const cheerio = require('cheerio');
const html = `<div class="card">
      <div class="row"><span class="label">Category :</span> <span class="val-orange">Web Series Hindi Dubbed</span></div>
      <div class="row"><span class="label">Movie Name :</span> <span class="val-blue">Money Heist</span></div>
</div>`;
const $ = cheerio.load(html);
let category = '';
$('.card').find('.row').each((_, row) => {
  const label = $(row).find('.label').text().trim();
  const val = $(row).find('.val-blue, .val-green, .val-orange').text().trim();
  console.log('label:', label, 'val:', val);
  if (label.includes('Category')) category = val;
});
console.log('category result:', category);
