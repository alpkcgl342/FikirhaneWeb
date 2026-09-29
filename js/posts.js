// Yazı, kategori ve görsel yükleme API çağrıları

import { api } from './api.js';

function toQuery(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

/** { page, limit, category, tag, author, status } — taslaklar için auth gerekir. */
export function listPosts(params = {}) {
  return api(`/posts${toQuery(params)}`, { auth: true });
}

export function getPost(slug) {
  return api(`/posts/${encodeURIComponent(slug)}`, { auth: true });
}

export function createPost(data) {
  return api('/posts', { method: 'POST', body: data, auth: true });
}

export function updatePost(id, data) {
  return api(`/posts/${id}`, { method: 'PATCH', body: data, auth: true });
}

export function deletePost(id) {
  return api(`/posts/${id}`, { method: 'DELETE', auth: true });
}

let categoriesPromise = null;
export function listCategories() {
  categoriesPromise ??= api('/categories').then((result) => result.items);
  return categoriesPromise;
}

export async function uploadImage(blob, filename) {
  const form = new FormData();
  form.append('file', blob, filename);
  const { url } = await api('/uploads/image', { method: 'POST', body: form, auth: true });
  return url;
}

export function postUrl(slug) {
  return `/pages/post.html?slug=${encodeURIComponent(slug)}`;
}

export function editorUrl(slug) {
  return slug ? `/pages/editor.html?slug=${encodeURIComponent(slug)}` : '/pages/editor.html';
}
