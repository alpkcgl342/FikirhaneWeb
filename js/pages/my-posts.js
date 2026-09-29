import { getCurrentUser } from '../auth.js';
import { initHeader } from '../components/header.js';
import { mountPostList } from '../components/post-list.js';
import { requireAuth, routes } from '../router.js';

const EMPTY_MESSAGES = {
  ALL: 'Henüz hiç yazın yok.',
  DRAFT: 'Taslak yazın yok.',
  PUBLISHED: 'Henüz yayınlanmış yazın yok.',
  BOOKMARKED: 'Henüz kaydettiğin bir yazı yok. Beğendiğin yazıları 🔖 Kaydet ile buraya ekleyebilirsin.',
};

function emptyState(status) {
  const box = document.createElement('div');
  box.className = 'card empty-state';
  const text = document.createElement('p');
  text.textContent = EMPTY_MESSAGES[status];
  const link = document.createElement('a');
  link.className = 'btn btn-primary';
  if (status === 'BOOKMARKED') {
    link.href = routes.home;
    link.textContent = 'Yazılara göz at';
  } else {
    link.href = routes.editor;
    link.textContent = 'Yazmaya başla';
  }
  box.append(text, link);
  return box;
}

function show(status) {
  // Yayınlanmış yazılar herkese açık listeden, yazar adıyla filtrelenerek gelir;
  // taslak ve "tümü" ise sunucuda her zaman isteyenin kendi yazılarıyla sınırlıdır.
  const params = {
    PUBLISHED: { author: getCurrentUser()?.username },
    BOOKMARKED: { bookmarked: true },
  }[status] ?? { status };
  const ownPosts = status !== 'BOOKMARKED';
  void mountPostList(document.getElementById('my-posts'), {
    params,
    cardOptions: { showStatus: ownPosts, showEdit: ownPosts },
    emptyState: emptyState(status),
  });
}

function init() {
  void initHeader();
  const tabs = document.querySelectorAll('.filter-tabs [data-status]');
  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      for (const other of tabs) other.setAttribute('aria-selected', String(other === tab));
      show(tab.dataset.status);
    });
  }
  show('ALL');
}

if (requireAuth()) init();
