// Yazı özet kartı. Tüm metinler textContent ile yazılır (XSS'e karşı).

import { editorUrl, postUrl } from '../posts.js';

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatDate(value) {
  return dateFormatter.format(new Date(value));
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function metaLine(post) {
  const parts = [post.author.displayName, formatDate(post.createdAt), `${post.readingTime} dk okuma`];
  return parts.join(' · ');
}

/** { showStatus, showEdit } seçenekleri "Yazılarım" sayfası içindir. */
export function renderPostCard(post, { showStatus = false, showEdit = false } = {}) {
  const card = el('article', 'post-card');

  if (post.coverUrl) {
    const coverLink = el('a', 'post-card-cover');
    coverLink.href = postUrl(post.slug);
    coverLink.tabIndex = -1;
    const img = el('img');
    img.src = post.coverUrl;
    img.alt = '';
    img.loading = 'lazy';
    coverLink.append(img);
    card.append(coverLink);
  }

  const body = el('div', 'post-card-body');

  const badges = el('div', 'post-card-badges');
  if (showStatus && post.status === 'DRAFT') badges.append(el('span', 'badge badge-draft', 'Taslak'));
  if (post.category) badges.append(el('span', 'badge', post.category.name));
  if (badges.childElementCount) body.append(badges);

  const title = el('h2', 'post-card-title');
  const titleLink = el('a', null, post.title);
  titleLink.href = postUrl(post.slug);
  title.append(titleLink);
  body.append(title);

  if (post.excerpt) body.append(el('p', 'post-card-excerpt', post.excerpt));

  const footer = el('div', 'post-card-footer');
  footer.append(el('span', 'post-meta', metaLine(post)));
  if (showEdit) {
    const edit = el('a', 'btn btn-ghost btn-sm', 'Düzenle');
    edit.href = editorUrl(post.slug);
    footer.append(edit);
  }
  body.append(footer);

  if (post.tags.length) {
    const tags = el('ul', 'tag-list');
    for (const tag of post.tags) tags.append(el('li', 'tag', `#${tag}`));
    body.append(tags);
  }

  card.append(body);
  return card;
}
