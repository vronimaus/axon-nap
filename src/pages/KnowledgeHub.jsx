import { useEffect } from 'react';
import { createPageUrl } from '@/utils';

export default function KnowledgeHub() {
  useEffect(() => {
    window.location.replace(createPageUrl('Wissen'));
  }, []);
  return null;
}