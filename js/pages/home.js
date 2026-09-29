import { getCurrentUser } from '../auth.js';
import { initHeader } from '../components/header.js';
import { mountPostList } from '../components/post-list.js';
import { getQueryParam, routes } from '../router.js';

// Akış sekmeleri; seçim adreste (?akis=) tutulur, böylece yenilemede ve paylaşımda korunur.
const FEEDS = {
  yeni: { params: {}, empty: 'Henüz yayınlanmış bir yazı yok. İlk yazıyı sen yaz!' },
  populer: { params: { sort: 'popular' }, empty: 'Henüz yayınlanmış bir yazı yok. İlk yazıyı sen yaz!' },
  takip: {
    params: { following: true },
    empty: 'Takip ettiğin kişilerin henüz yazısı yok. Yazarların profilinden onları takip edebilirsin.',
  },
};

function emptyState(text, withLink) {
  const box = document.createElement('div');
  box.className = 'card empty-state';
  const p = document.createElement('p');
  p.textContent = text;
  box.append(p);
  if (withLink) {
    const link = document.createElement('a');
    link.className = 'btn btn-primary';
    link.href = routes.editor;
    link.textContent = 'Yazmaya başla';
    box.append(link);
  }
  return box;
}

function showFeed(name) {
  const feed = FEEDS[name];
  for (const tab of document.querySelectorAll('[data-feed]')) {
    tab.setAttribute('aria-selected', String(tab.dataset.feed === name));
  }
  const url = new URL(window.location.href);
  if (name === 'yeni') url.searchParams.delete('akis');
  else url.searchParams.set('akis', name);
  window.history.replaceState(null, '', url.pathname + url.search);

  void mountPostList(document.getElementById('latest-posts'), {
    params: feed.params,
    emptyState: emptyState(feed.empty, name !== 'takip'),
  });
}

const user = getCurrentUser();
const followTab = document.querySelector('[data-feed="takip"]');
followTab.hidden = !user;

for (const tab of document.querySelectorAll('[data-feed]')) {
  tab.addEventListener('click', () => showFeed(tab.dataset.feed));
}

const requested = getQueryParam('akis');
showFeed(requested in FEEDS && (requested !== 'takip' || user) ? requested : 'yeni');

await initHeader();

// Giriş yapmış kullanıcıya kayıt çağrısı yerine karşılama göster.
if (user) {
  document.querySelector('[data-guest-only]')?.setAttribute('hidden', '');
  const welcome = document.querySelector('[data-welcome]');
  if (welcome) {
    welcome.textContent = `Hoş geldin, ${user.displayName}!`;
    welcome.hidden = false;
  }
}
