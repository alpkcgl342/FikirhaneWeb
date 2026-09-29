// Oturum durumuna göre üst menüyü doldurur

import { getCurrentUser, logout, refreshCurrentUser } from '../auth.js';
import { redirect, routes } from '../router.js';

function link(href, text, className) {
  const a = document.createElement('a');
  a.href = href;
  a.className = className;
  a.textContent = text;
  return a;
}

function render(nav, user) {
  nav.replaceChildren();

  if (!user) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    nav.append(
      link(`${routes.login}?next=${next}`, 'Giriş yap', 'btn btn-ghost'),
      link(routes.register, 'Kayıt ol', 'btn btn-primary'),
    );
    return;
  }

  const name = document.createElement('span');
  name.className = 'nav-user';
  name.textContent = user.displayName;
  name.title = `@${user.username}`;

  const logoutButton = document.createElement('button');
  logoutButton.type = 'button';
  logoutButton.className = 'btn btn-ghost';
  logoutButton.textContent = 'Çıkış yap';
  logoutButton.addEventListener('click', () => {
    logout();
    redirect(routes.home);
  });

  nav.append(name, logoutButton);
}

export async function initHeader() {
  const nav = document.querySelector('[data-site-nav]');
  if (!nav) return;

  render(nav, getCurrentUser());
  // Kayıtlı bilgiyle hemen çiz, ardından sunucudan doğrula.
  const fresh = await refreshCurrentUser();
  render(nav, fresh);
}
