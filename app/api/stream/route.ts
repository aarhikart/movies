import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    const range = request.headers.get('range');
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': targetUrl,
    };
    if (range) {
      headers['Range'] = range;
    }

    const upstreamRes = await fetch(targetUrl, {
      headers,
      redirect: 'follow',
    });

    const responseHeaders = new Headers();
    const contentType = upstreamRes.headers.get('content-type') || 'video/mp4';
    responseHeaders.set('Content-Type', contentType);

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) responseHeaders.set('Content-Length', contentLength);

    const contentRange = upstreamRes.headers.get('content-range');
    if (contentRange) responseHeaders.set('Content-Range', contentRange);

    const acceptRanges = upstreamRes.headers.get('accept-ranges') || 'bytes';
    responseHeaders.set('Accept-Ranges', acceptRanges);

    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('Video Stream Proxy Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
