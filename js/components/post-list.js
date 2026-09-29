// Sayfalı yazı listesi: ilk sayfayı yükler, "Daha fazla" ile devamını ekler.

import { listPosts } from '../posts.js';
import { renderPostCard } from './post-card.js';

/**
 * container içine listeyi çizer.
 * params: listPosts parametreleri; load(page): özel veri kaynağı (ör. arama) — verilirse params yok sayılır;
 * onFirstPage(result): ilk sayfa geldiğinde çağrılır; cardOptions: renderPostCard seçenekleri;
 * emptyState: boş listede gösterilecek düğüm.
 */
export function mountPostList(
  container,
  { params = {}, load, onFirstPage, cardOptions = {}, emptyState } = {},
) {
  const fetchPage = load ?? ((page) => listPosts({ ...params, page }));
  let page = 0;
  let loading = false;

  const list = document.createElement('div');
  list.className = 'post-list';
  const status = document.createElement('p');
  status.className = 'list-status';
  status.setAttribute('role', 'status');
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'btn btn-ghost load-more';
  more.textContent = 'Daha fazla yazı';
  more.hidden = true;

  container.replaceChildren(list, status, more);

  async function loadNext() {
    if (loading) return;
    loading = true;
    more.disabled = true;
    status.textContent = page === 0 ? 'Yazılar yükleniyor…' : '';
    try {
      const result = await fetchPage(page + 1);
      // Bu arada aynı kaba başka bir liste kurulduysa (ör. sekme değişti) sonuç atılır.
      if (!list.isConnected) return;
      if (page === 0) onFirstPage?.(result);
      page = result.page;
      for (const post of result.items) list.append(renderPostCard(post, cardOptions));
      status.textContent = '';
      if (result.total === 0 && emptyState) container.replaceChildren(emptyState);
      more.hidden = page >= result.totalPages;
    } catch (error) {
      status.textContent = error.message;
    } finally {
      loading = false;
      more.disabled = false;
    }
  }

  more.addEventListener('click', loadNext);
  return loadNext();
}
