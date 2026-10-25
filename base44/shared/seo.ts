// Gemeinsame SEO-Bausteine für sitemap, llmsTxt und pingIndexNow.
//
// WICHTIG: articleUrl() MUSS zeichengleich mit dem Canonical in
// src/pages/WissenArtikel.jsx und dem Link in src/pages/Wissen.jsx sein.
// Sitemap, IndexNow und Canonical dürfen nie unterschiedliche Adressen nennen,
// sonst entstehen genau die Duplikate, die das Canonical verhindern soll.
// Reihenfolge category vor slug = so, wie Base44 das Canonical auch serverseitig
// ausliefert.

export const HOST = 'axon-nap.de';
export const ORIGIN = `https://${HOST}`;

// IndexNow-Schlüssel ist KEIN Geheimnis: IndexNow prüft ihn über die öffentliche
// Datei public/<schlüssel>.txt. Beide müssen übereinstimmen.
export const INDEXNOW_KEY = 'ad03f49e25d8b481382d4db30ac914f1';

export function articleUrl(a: { slug?: string; category?: string }): string {
  return `${ORIGIN}/WissenArtikel?category=${encodeURIComponent(a.category || '')}&slug=${encodeURIComponent(a.slug || '')}`;
}

// Öffentliche, indexierbare Seiten (Routen sind die Seitennamen aus pages.config.js).
// "/" fehlt bewusst: dort liegt das Dashboard, das Gäste auf /Landing umleitet.
export const STATIC_PAGES = [
  { path: '/Landing', changefreq: 'weekly', priority: '1.0', title: 'AXON-nap – Mobility- & Trainings-Tool für Athleten' },
  { path: '/Wissen', changefreq: 'weekly', priority: '0.9', title: 'Wissen: Neuroathletik & Faszien' },
  { path: '/Faq', changefreq: 'monthly', priority: '0.7', title: 'FAQ – Häufige Fragen' },
  { path: '/Glossar', changefreq: 'monthly', priority: '0.6', title: 'Glossar – Fachbegriffe Neuroathletik' },
  { path: '/Literatur', changefreq: 'monthly', priority: '0.6', title: 'Wissenschaftliche Quellen & Literatur' },
  { path: '/Imprint', changefreq: 'yearly', priority: '0.2', title: 'Impressum' },
  { path: '/Privacy', changefreq: 'yearly', priority: '0.2', title: 'Datenschutz' },
  { path: '/Terms', changefreq: 'yearly', priority: '0.2', title: 'AGB' },
];

// Alle veröffentlichten Artikel seitenweise laden – kein festes Limit.
const PAGE_SIZE = 200;
const MAX_RECORDS = 45000; // Notbremse; eine Sitemap-Datei erlaubt 50.000 URLs
export async function loadPublishedArticles(entity: any): Promise<any[]> {
  const all: any[] = [];
  for (let skip = 0; skip < MAX_RECORDS; skip += PAGE_SIZE) {
    const page = await entity.filter({ published: true }, '-updated_date', PAGE_SIZE, skip);
    if (!Array.isArray(page) || page.length === 0) break;
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  // Jede Adresse nur einmal, nur mit slug + category
  const seen = new Set<string>();
  return all.filter((a) => {
    if (!a?.slug || !a?.category || a.published !== true) return false;
    const key = `${a.category}/${a.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
