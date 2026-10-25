import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { ORIGIN, STATIC_PAGES, articleUrl, loadPublishedArticles } from '../../shared/seo.ts';

// Dynamische XML-Sitemap für axon-nap.de: statische öffentliche Seiten +
// alle veröffentlichten KnowledgeArticle (paginiert, kein 500er-Limit).
// Erreichbar unter https://axon-nap.de/functions/sitemap

const escapeXml = (s: string) =>
  (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const day = (d?: string) => {
  const t = d ? new Date(d) : null;
  return t && !isNaN(t.getTime()) ? t.toISOString().split('T')[0] : null;
};

Deno.serve(async (req) => {
  // Statische Seiten ohne lastmod (sonst signalisiert jeder Abruf "heute geändert")
  const staticEntries = STATIC_PAGES.map(
    (p) => `  <url>\n    <loc>${ORIGIN}${p.path}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
  );

  let articleEntries: string[] = [];
  try {
    const base44 = createClientFromRequest(req);
    const articles = await loadPublishedArticles(base44.asServiceRole.entities.KnowledgeArticle);
    articleEntries = articles.map((a) => {
      const lastmod = day(a.updated_date) || day(a.created_date);
      return `  <url>\n    <loc>${escapeXml(articleUrl(a))}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    });
  } catch (err) {
    // DB-Fehler: trotzdem gültige Sitemap (nur statische Seiten) statt HTTP-Fehler
    console.error('sitemap: Artikel konnten nicht geladen werden:', (err as Error)?.message || err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticEntries, ...articleEntries].join('\n')}\n</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
});
