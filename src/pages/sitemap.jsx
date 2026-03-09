export default function Sitemap() {
  const urls = [
    { path: '/', priority: '1.0' },
    { path: '/RehabFunnel', priority: '0.9' },
    { path: '/Wissen', priority: '0.8' },
    { path: '/FAQ', priority: '0.8' },
    { path: '/Literatur', priority: '0.8' },
    { path: '/Imprint', priority: '0.5' },
    { path: '/Privacy', priority: '0.5' },
    { path: '/Terms', priority: '0.5' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ path, priority }) => `  <url>
    <loc>https://axon-nap.de${path}</loc>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return (
    <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'monospace' }}>
      {xml}
    </pre>
  );
}