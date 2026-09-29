// Oturum durumuna göre üst menüyü doldurur; arama kutusunu ekler

import { getCurrentUser, logout, refreshCurrentUser } from '../auth.js';
import { searchUrl } from '../posts.js';
import { getQueryParam, redirect, routes } from '../router.js';
import { profileUrl } from '../users.js';

function link(href, text, className) {
  const a = document.createElement('a');
  a.href = href;
  a.className = className;
  a.textContent = text;
  return a;
}

/** Logo ile menü arasına arama kutusu ekler (sayfa başına bir kez). */
function mountSearch(nav) {
  if (document.querySelector('.site-search')) return;

  const form = document.createElement('form');
  form.className = 'site-search';
  form.setAttribute('role', 'search');

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'Yazı, yazar veya etiket ara…';
  input.setAttribute('aria-label', 'Ara');
  input.minLength = 2;
  input.maxLength = 100;
  // Arama sayfasındayken kutuda mevcut terim görünsün.
  // (Vercel adreslerde .html uzantısını kaldırdığı için uzantısız karşılaştırılır.)
  const withoutExt = (path) => path.replace(/\.html$/, '');
  if (withoutExt(window.location.pathname) === withoutExt(routes.search)) {
    input.value = getQueryParam('q') ?? '';
  }

  form.append(input);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const q = input.value.trim();
    if (q.length >= 2) redirect(searchUrl(q));
  });
  nav.before(form);
}

function render(nav, user) {
  nav.replaceChildren();
  const searchLink = link(routes.search, 'Ara', 'btn btn-ghost search-link');

  if (!user) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    nav.append(
      searchLink,
      link(`${routes.login}?next=${next}`, 'Giriş yap', 'btn btn-ghost'),
      link(routes.register, 'Kayıt ol', 'btn btn-primary'),
    );
    return;
  }

  const name = link(profileUrl(user.username), user.displayName, 'nav-user');
  name.title = `Profilim (@${user.username})`;

  const logoutButton = document.createElement('button');
  logoutButton.type = 'button';
  logoutButton.className = 'btn btn-ghost';
  logoutButton.textContent = 'Çıkış yap';
  logoutButton.addEventListener('click', () => {
    logout();
    redirect(routes.home);
  });

  nav.append(
    searchLink,
    link(routes.editor, 'Yaz', 'btn btn-primary'),
    link(routes.myPosts, 'Yazılarım', 'btn btn-ghost nav-secondary'),
    name,
    logoutButton,
  );
}

export async function initHeader() {
  const nav = document.querySelector('[data-site-nav]');
  if (!nav) return;

  mountSearch(nav);
  render(nav, getCurrentUser());
  // Kayıtlı bilgiyle hemen çiz, ardından sunucudan doğrula.
  const fresh = await refreshCurrentUser();
  render(nav, fresh);
}
