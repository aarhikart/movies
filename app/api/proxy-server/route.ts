import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new Response('URL is required', { status: 400 });
    }

    let cleanUrl = targetUrl.replace(/https?:\/\/(?:www\.)+filmyzilla\d*\.com/g, 'https://www.filmyzilla67.com');

    // Cloudflare Turnstile Domain Fix for Hosted Websites:
    // Turnstile sitekey 0x4AAAAAAEtAwHhA8H6PiX2N is bound to "filmyzilla67.com".
    // When proxied through a hosted domain (e.g. *.vercel.app or custom domain),
    // Cloudflare rejects Turnstile with "Unable to connect to website".
    // Redirect directly to the authorized Filmyzilla domain so Turnstile executes properly!
    if (cleanUrl.includes('/dl/') || cleanUrl.includes('/verified/')) {
      const dlMatch = cleanUrl.match(/\/dl\/(\d+)\/(server_\d+)\//i);
      const targetVerifyUrl = dlMatch
        ? `https://www.filmyzilla67.com/verified/${dlMatch[1]}/${dlMatch[2]}/`
        : cleanUrl.replace('/dl/', '/verified/');
      return NextResponse.redirect(targetVerifyUrl, 302);
    }

    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.filmyzilla67.com/'
      }
    });

    let html = await res.text();
    let finalOrigin = new URL(res.url || cleanUrl).origin;

    // Token Auto-Refresh: If /dl/ URL returns "Token expired" or is too short, refresh via /verified/
    if ((html.includes('Token expired') || html.length < 100) && cleanUrl.includes('/dl/')) {
      const dlMatch = cleanUrl.match(/\/dl\/(\d+)\/(server_\d+)\//);
      if (dlMatch) {
        const freshUrl = `https://www.filmyzilla67.com/verified/${dlMatch[1]}/${dlMatch[2]}/`;
        try {
          const freshRes = await fetch(freshUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Referer': 'https://www.filmyzilla67.com/'
            }
          });
          if (freshRes.ok) {
            html = await freshRes.text();
            cleanUrl = freshRes.url || freshUrl;
            finalOrigin = new URL(cleanUrl).origin;
          }
        } catch (err) {}
      }
    }

    const $ = cheerio.load(html);

    // Detect if this is the "Verify You're Human" page
    const isVerifyPage = html.includes("Verify You're Human") || html.includes('cf-turnstile') || html.includes('turnstile_check');

    // Extract get_link ID from packed script if present (Server selection page)
    let getLinkId = '';
    $('script').each((_, el) => {
      const content = $(el).html();
      if (content && content.includes('eval(function(p,a,c,k,e,d)')) {
        try {
          const unpacked = eval(content.replace(/^\s*eval\(/, '('));
          const m = unpacked.match(/\/get_link\.php\?id=([a-zA-Z0-9_-]+)/);
          if (m) getLinkId = m[1];
        } catch (e) {}
      }
    });

    const idMatch = targetUrl.match(/\/(\d+)\//) || cleanUrl.match(/\/(\d+)\//);
    const movieId = idMatch ? idMatch[1] : '';

    if (isVerifyPage) {
      // Rewrite form action to submit directly to Filmyzilla with target="_blank"
      // This sends Turnstile response directly to Filmyzilla and starts the file download
      html = html.replace(/<form\s+method=["']POST["'][^>]*>/i, `<form method="POST" id="verifyForm" action="${cleanUrl}" target="_blank">`);
    }

    // Injected style and script for both Verify page and Server selection page
    const injectedHead = `
      <base href="${finalOrigin}/">
      <style>
        /* Modern styling & UI glitch fix for Verify You're Human button */
        .verify-box {
          border-radius: 18px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04) !important;
        }
        .verify-box button, button[type="submit"] {
          display: block !important;
          width: 100% !important;
          padding: 14px 20px !important;
          border: none !important;
          border-radius: 12px !important;
          background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
          color: #ffffff !important;
          font-size: 16px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35) !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          outline: none !important;
          text-align: center !important;
          user-select: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        .verify-box button:hover, button[type="submit"]:hover {
          background: linear-gradient(135deg, #1d4ed8, #1e40af) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45) !important;
        }
        .verify-box button:active, button[type="submit"]:active {
          transform: scale(0.98) translateY(1px) !important;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25) !important;
        }

        /* Server Selection buttons */
        .newdl, button.newdl {
          display: inline-block !important;
          color: #fff !important;
          text-align: center !important;
          min-width: 180px !important;
          cursor: pointer !important;
          background-color: #fd2e18 !important;
          font-weight: bold !important;
          margin-bottom: 10px !important;
          margin-left: 9px !important;
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.506) !important;
          border-radius: 8px !important;
          padding: 12px 18px !important;
          font-size: 12px !important;
          text-decoration: none !important;
          border: 0 !important;
          outline: none !important;
          transition: all 0.15s ease !important;
        }
        .newdl:hover, .appsvital:hover {
          opacity: 0.9 !important;
          transform: scale(1.02) !important;
        }
        button, a {
          cursor: pointer !important;
        }
      </style>
      <script>
        // 1. Override window.location.assign so any internal redirect triggers server selection in parent
        try {
          window.location.assign = function(url) {
            let target = url;
            if (target.startsWith('/')) {
              target = '${finalOrigin}' + target;
            }
            target = target.replace(/https?:\\/\\/(?:www\\.)+filmyzilla\\d*\\.com/g, 'https://www.filmyzilla67.com');
            try {
              window.parent.postMessage({ type: 'SERVER_SELECTED', url: target }, '*');
            } catch(e) {}
          };
        } catch (e) {}

        // 2. Intercept actions based on page type
        window.addEventListener('DOMContentLoaded', () => {
          // If on Verify You're Human page:
          const verifyBtn = document.querySelector('.verify-box button, button[type="submit"]');
          const verifyForm = document.querySelector('form') || document.getElementById('verifyForm');

          function triggerVerifyDownload() {
            if (verifyBtn) {
              verifyBtn.style.opacity = '0.85';
              verifyBtn.innerHTML = 'Starting Download... ⚡';
            }
            try {
              window.parent.postMessage({ 
                type: 'DOWNLOAD_TRIGGER', 
                url: '${cleanUrl}',
                source: 'verify_human'
              }, '*');
            } catch (err) {}
          }

          if (verifyForm) {
            verifyForm.addEventListener('submit', triggerVerifyDownload);
          }
          if (verifyBtn) {
            verifyBtn.addEventListener('click', triggerVerifyDownload);
          }

          // If on Server Selection page:
          document.addEventListener('click', async (e) => {
            // Check top 2 buttons (Server 1 & 2)
            const btn = e.target.closest('button, .newdl');
            if (btn && !btn.closest('.verify-box')) {
              e.preventDefault();
              e.stopPropagation();
              const sId = btn.getAttribute('data-server') || '1';
              
              let finalDownloadLink = '';
              if ('${getLinkId}') {
                try {
                  const res = await fetch('/get_link.php?id=${getLinkId}', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                      'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: 'server=' + encodeURIComponent(sId)
                  });
                  const data = await res.json();
                  if (data && data.success && data.link) {
                    finalDownloadLink = data.link;
                  }
                } catch (err) {}
              }

              if (!finalDownloadLink) {
                finalDownloadLink = 'https://www.filmyzilla67.com/verified/${movieId}/server_' + sId + '/';
              }

              finalDownloadLink = finalDownloadLink.replace(/https?:\\/\\/(?:www\\.)+filmyzilla\\d*\\.com/g, 'https://www.filmyzilla67.com');
              
              try {
                window.parent.postMessage({ 
                  type: 'SERVER_SELECTED', 
                  url: finalDownloadLink,
                  serverId: sId 
                }, '*');
              } catch (err) {}
              return;
            }

            // Check anchor links (Server 3, 4, 5, 6)
            const link = e.target.closest('a');
            if (link && !link.closest('.verify-box')) {
              const href = link.getAttribute('href');
              if (href && !href.startsWith('javascript:')) {
                e.preventDefault();
                let fullUrl = href;
                if (fullUrl.startsWith('/')) {
                  fullUrl = '${finalOrigin}' + fullUrl;
                }
                fullUrl = fullUrl.replace(/https?:\\/\\/(?:www\\.)+filmyzilla\\d*\\.com/g, 'https://www.filmyzilla67.com');
                
                try {
                  window.parent.postMessage({ 
                    type: 'SERVER_SELECTED', 
                    url: fullUrl 
                  }, '*');
                } catch(err) {}
              }
            }
          }, true);
        });
      </script>
    `;

    html = html.replace('<head>', '<head>' + injectedHead);

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    return new Response('Failed to load server page: ' + err.message, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    if (!targetUrl) {
      return new Response('URL is required', { status: 400 });
    }
    const cleanUrl = targetUrl.replace(/https?:\/\/(?:www\.)+filmyzilla\d*\.com/g, 'https://www.filmyzilla67.com');
    const body = await request.text();
    const contentType = request.headers.get('content-type') || 'application/x-www-form-urlencoded';

    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': cleanUrl,
        'Content-Type': contentType,
      },
      body: body,
      redirect: 'manual'
    });

    const location = res.headers.get('location');
    if (location) {
      return NextResponse.redirect(location, 302);
    }

    const resBody = await res.text();
    return new Response(resBody, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'text/html',
      }
    });
  } catch (err: any) {
    return new Response('POST Error: ' + err.message, { status: 500 });
  }
}
