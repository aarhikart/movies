import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let html = '';
    try {
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      });
      html = await res.text();
    } catch (fetchErr: any) {
      console.error('Download fetch error:', fetchErr);
      return NextResponse.json({ 
        success: false, 
        fallbackUrl: targetUrl, 
        error: fetchErr.message 
      });
    }

    const $ = cheerio.load(html);
    const parsedUrl = new URL(targetUrl);
    const origin = parsedUrl.origin;

    // Extract File Name
    const fileName = $('.head').text().trim() || 
                     $('meta[property="og:title"]').attr('content')?.trim() || 
                     $('title').text().trim() || 
                     '';

    // Extract File Size
    let fileSize = '';
    $('font, span, div').each((_, el) => {
      if (fileSize) return;
      const text = $(el).text().trim();
      const match = text.match(/Size of file:?\s*([0-9.]+\s*[KMGT]?B)/i) || 
                    text.match(/^([0-9.]+\s*(?:MB|GB|KB))$/i);
      if (match) {
        fileSize = match[1] || match[0];
      }
    });

    if (!fileSize) {
      $('font[color="#76B23E"]').each((_, el) => {
        const text = $(el).text().trim();
        if (/MB|GB|KB/i.test(text)) {
          fileSize = text;
        }
      });
    }

    // Extract Download Servers
    const servers: { name: string; url: string }[] = [];
    const seenUrls = new Set<string>();

    $('a.appsvital, a.newdl, a[href*="/verified/"], a[href*="/dl/"]').each((_, el) => {
      let href = $(el).attr('href')?.trim();
      if (!href || href === '#' || href.startsWith('javascript:')) return;

      // Make absolute URL
      if (href.startsWith('/')) {
        href = origin + href;
      } else if (!href.startsWith('http')) {
        href = origin + '/' + href;
      }

      if (seenUrls.has(href)) return;
      seenUrls.add(href);

      let text = $(el).text().trim().replace(/[\r\n\t]+/g, ' ');
      if (!text) text = `Server ${servers.length + 1}`;
      
      // Clean up server button text for modern UI
      text = text.replace(/^Start Download Now\s*[-–]\s*/i, '');

      servers.push({
        name: text,
        url: href
      });
    });

    return NextResponse.json({
      success: true,
      fileName,
      fileSize,
      servers,
      originalUrl: targetUrl
    });

  } catch (error: any) {
    console.error('Download Info API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
