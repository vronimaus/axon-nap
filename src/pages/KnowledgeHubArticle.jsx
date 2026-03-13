import { useEffect } from 'react';

export default function KnowledgeHubArticle() {
  useEffect(() => {
    const params = window.location.search;
    window.location.replace('/WissenArtikel' + params);
  }, []);
  return null;
}