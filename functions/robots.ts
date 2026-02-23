Deno.serve(async (req) => {
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  // Die URL für die Sitemap ist die URL dieser App + /functions/sitemap
  const sitemapUrl = `${baseUrl}/functions/sitemap`;

  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${sitemapUrl}
`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // 24 Stunden Cache
    }
  });
});