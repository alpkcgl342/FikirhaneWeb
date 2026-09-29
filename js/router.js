// Sayfalar arası yönlendirme yardımcıları

import { isLoggedIn } from './auth.js';

export const routes = {
  home: '/',
  login: '/pages/login.html',
  register: '/pages/register.html',
  editor: '/pages/editor.html',
  myPosts: '/pages/my-posts.html',
  search: '/pages/search.html',
};

/** Giriş yapmamış kullanıcıyı, dönüşte bu sayfaya gelecek şekilde giriş sayfasına yollar. */
export function requireAuth() {
  if (isLoggedIn()) return true;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.replace(`${routes.login}?next=${next}`);
  return false;
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * `?next=` ile gelen adresi yalnızca site içi bir yol ise kabul eder;
 * aksi halde açık yönlendirme (open redirect) riskine karşı ana sayfaya döner.
 */
export function safeNext(next) {
  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
    return next;
  }
  return routes.home;
}

export function redirect(path) {
  window.location.assign(path);
}

/** Giriş yapmış kullanıcıyı giriş/kayıt sayfalarından uzaklaştırır. */
export function redirectIfLoggedIn() {
  if (isLoggedIn()) {
    window.location.replace(safeNext(getQueryParam('next')));
    return true;
  }
  return false;
}
