import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { HOST, ORIGIN, INDEXNOW_KEY, STATIC_PAGES, articleUrl, loadPublishedArticles } from '../../shared/seo.ts';

// Meldet einen veröffentlichten KnowledgeArticle an IndexNow (Bing, Yandex,
// Seznam, Naver …). Ausgelöst vom Workflow "IndexNow bei veröffentlichten
// Wissensartikeln" (create/update).
//
// Kein Admin-Check, weil der Workflow keinen angemeldeten Nutzer hat. Der
// eigentliche Schutz: Der Datensatz wird frisch geladen und NUR gemeldet, wenn
// er veröffentlicht ist. Entwürfe werden nie gemeldet.
//
// Body: { entity_id: string }   (Sammelmeldung von Hand: { all: true } als Admin)

const ENDPOINT = 'https://api.indexnow.org/indexnow';

async function submit(urls: string[]) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `${ORIGIN}/${INDEXNOW_KEY}.txt`, urlList: urls.slice(0, 10000) }),
  });
  const note = await res.text().catch(() => '');
  return { status: res.status, ok: res.status === 200 || res.status === 202, submitted: Math.min(urls.length, 10000), note: note.slice(0, 200) || undefined };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};

    // Sammelmeldung aller veröffentlichten Artikel – nur für Admins
    if (body.all === true) {
      const user = await base44.auth.me().catch(() => null);
      if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
      const articles = await loadPublishedArticles(db.entities.KnowledgeArticle);
      const urls = [...STATIC_PAGES.map((p) => `${ORIGIN}${p.path}`), ...articles.map(articleUrl)];
      return Response.json({ urls: urls.length, result: await submit(urls) });
    }

    const entityId = String(body.entity_id || body.event?.entity_id || body.data?.id || '');
    if (!entityId) return Response.json({ error: 'entity_id fehlt' }, { status: 400 });

    const record = await db.entities.KnowledgeArticle.get(entityId).catch(() => null);
    if (!record) return Response.json({ skipped: 'Datensatz nicht gefunden', entityId });
    if (record.published !== true || !record.slug || !record.category) {
      return Response.json({ skipped: 'Artikel ist nicht veröffentlicht', entityId });
    }

    const url = articleUrl(record);
    const result = await submit([url]);
    console.log(`IndexNow: HTTP ${result.status} für ${url}`);
    return Response.json({ entityId, url, ...result });
  } catch (error) {
    console.error('pingIndexNow:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
