import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Holt freigegebene Titles/Descriptions aus dem SEO-Cockpit und setzt sie für die aktuelle Seite.
// Ohne Eintrag im Cockpit oder bei einem Fehler bleibt alles, wie der Seitencode es setzt.
const ENDPOINT = 'https://seo-cockpit-92704c2f.base44.app/functions/seo-overrides';

let cache = null;
function loadOverrides() {
  if (!cache) {
    const domain = window.location.hostname.replace(/^www\./, '');
    cache = fetch(`${ENDPOINT}?domain=${encodeURIComponent(domain)}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((j) => j.overrides || {})
      .catch(() => ({}));
  }
  return cache;
}

function setMeta(attr, name, value) {
  if (!value) return;
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  if (tag.getAttribute('content') !== value) tag.setAttribute('content', value);
}

export default function SeoOverrides() {
  const { pathname } = useLocation();

  useEffect(() => {
    let alive = true;
    let observer;
    loadOverrides().then((map) => {
      if (!alive) return;
      const key = pathname.replace(/\/+$/, '') || '/';
      const o = map[key];
      if (!o) return;
      const apply = () => {
        if (o.title && document.title !== o.title) document.title = o.title;
        setMeta('property', 'og:title', o.title);
        setMeta('name', 'twitter:title', o.title);
        setMeta('name', 'description', o.description);
        setMeta('property', 'og:description', o.description);
        setMeta('name', 'twitter:description', o.description);
      };
      apply();
      // Falls die Seite ihren Title später noch einmal setzt, gewinnt der Text aus dem Cockpit.
      observer = new MutationObserver(apply);
      observer.observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['content'] });
    });
    return () => {
      alive = false;
      if (observer) observer.disconnect();
    };
  }, [pathname]);

  return null;
}
