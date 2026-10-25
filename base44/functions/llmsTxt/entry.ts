import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { ORIGIN, STATIC_PAGES, articleUrl, loadPublishedArticles } from '../../shared/seo.ts';

// Dynamische llms.txt für KI-Assistenten: alle veröffentlichten Wissensartikel
// mit Kurzbeschreibung. Erreichbar unter https://axon-nap.de/functions/llmsTxt
// (die statische https://axon-nap.de/llms.txt verweist hierher).

const CATEGORY_LABELS: Record<string, string> = {
  experts: 'Experten',
  solutions: 'Lösungen für Beschwerden',
  methods: 'Methoden',
  sports: 'Sportarten',
  longevity: 'Longevity',
};

const oneLine = (s?: string) => (s || '').replace(/\s+/g, ' ').trim().slice(0, 300);

Deno.serve(async (req) => {
  let sections = '';
  try {
    const base44 = createClientFromRequest(req);
    const articles = await loadPublishedArticles(base44.asServiceRole.entities.KnowledgeArticle);
    const byCat: Record<string, any[]> = {};
    for (const a of articles) (byCat[a.category] ||= []).push(a);
    for (const cat of Object.keys(CATEGORY_LABELS)) {
      const list = byCat[cat];
      if (!list?.length) continue;
      sections += `\n## Wissen: ${CATEGORY_LABELS[cat]}\n`;
      for (const a of list) {
        sections += `- [${oneLine(a.headline)}](${articleUrl(a)}): ${oneLine(a.meta_description || a.summary)}\n`;
      }
    }
  } catch (err) {
    console.error('llmsTxt: Artikel konnten nicht geladen werden:', (err as Error)?.message || err);
  }

  const pages = STATIC_PAGES.map((p) => `- [${p.title}](${ORIGIN}${p.path})`).join('\n');

  const txt = `# AXON-nap (Neuro-Athletic-Protocol)

> AXON-nap ist ein Mobility- und Trainings-Tool für Athleten und Bewegungsinteressierte: Spannungspunkt markieren, Ursache erkennen, 3-Schritt-Protokoll ausführen (Faszien-Release, Neuro-Drill, Integration). Der öffentliche Wissensbereich erklärt Neuroathletik, Faszien, Schmerzmechanismen und sportartspezifische Protokolle auf Deutsch, mit Verweisen auf Forschung (u. a. Myers, Stecco, Schleip, McGill, Gray Cook).

## Seiten
${pages}
${sections}
## Hinweise
- Sprache: Deutsch (de-DE)
- Die Inhalte ersetzen keine ärztliche Diagnose; jeder Wissensartikel enthält eine Ampel, wann ärztliche Abklärung nötig ist.
- Website: ${ORIGIN}
`;

  return new Response(txt, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
});
