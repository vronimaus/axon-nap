import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Basis-URL der App (hier generisch als Platzhalter, idealerweise aus Env oder Request-Origin abgeleitet)
    // Bei Base44 Apps nutzen wir die Origin der Anfrage
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    // Dynamische Inhalte abrufen (z.B. öffentliche Knowledge Articles und Routinen)
    // Wir nutzen asServiceRole, da wir ggf. auch auf öffentliche Inhalte zugreifen, ohne dass ein User eingeloggt ist.
    const articles = await base44.asServiceRole.entities.KnowledgeArticle.filter({ published: true });
    
    // Start der XML-Sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Statische Routen (Landing Page)
    const staticRoutes = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/Landing', priority: '0.9', changefreq: 'weekly' }
    ];

    for (const route of staticRoutes) {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}${route.path}</loc>\n`;
      sitemap += `    <changefreq>${route.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${route.priority}</priority>\n`;
      sitemap += `  </url>\n`;
    }

    // Dynamische Routen (z.B. Artikel)
    for (const article of articles) {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/Article?slug=${article.slug}</loc>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += `  </url>\n`;
    }

    sitemap += `</urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      }
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
});