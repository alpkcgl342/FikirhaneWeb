// Markdown → güvenli HTML
// marked Markdown'ı HTML'e çevirir; DOMPurify ise çıktıdaki script, olay niteliği (onerror…)
// ve javascript: bağlantıları gibi XSS'e yol açabilecek her şeyi temizler.

import { marked } from './vendor/marked.esm.js';
import DOMPurify from './vendor/purify.es.js';

marked.setOptions({ gfm: true, breaks: true });

// Yazı içindeki bağlantılar yeni sekmede açılır ve açılan sayfa bu sayfaya erişemez.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer nofollow');
  }
  if (node.tagName === 'IMG') {
    node.setAttribute('loading', 'lazy');
  }
});

export function renderMarkdown(markdown) {
  const html = marked.parse(markdown ?? '', { async: false });
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'iframe'],
    FORBID_ATTR: ['style'],
  });
}

/** İstemci tarafı okuma süresi tahmini (sunucudakiyle aynı: dakikada 200 kelime). */
export function estimateReadingTime(markdown) {
  const words = (markdown ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
