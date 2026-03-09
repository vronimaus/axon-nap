export default function RobotsTxt() {
  const content = `User-agent: *
Allow: /

Disallow: /admin
Disallow: /admin-hub
Disallow: /checkout
Disallow: /success

Crawl-delay: 1

Sitemap: https://axon-nap.de/sitemap`;

  return (
    <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'monospace' }}>
      {content}
    </pre>
  );
}