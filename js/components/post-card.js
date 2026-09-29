// Yazı özet kartı. Tüm metinler textContent ile yazılır (XSS'e karşı).

import { categoryUrl, editorUrl, postUrl, tagUrl } from '../posts.js';
import { profileUrl } from '../users.js';

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

/** Kategori rozeti; kategori sayfasına bağlantıdır. */
export function renderCategoryBadge(category) {
  const badge = el('a', 'badge', category.name);
  badge.href = categoryUrl(category.slug);
  return badge;
}

/** #etiket listesi; her etiket kendi sayfasına bağlantıdır. */
export function renderTagList(tags) {
  const list = el('ul', 'tag-list');
  for (const tag of tags) {
    const item = el('li');
    const link = el('a', 'tag', `#${tag}`);
    link.href = tagUrl(tag);
    item.append(link);
    list.append(item);
  }
  return list;
}

/** "Yazar · tarih · N dk okuma" satırı; yazar adı profil bağlantısıdır. */
export function renderMeta(post, { counts = false } = {}) {
  const meta = el('span', 'post-meta');
  const author = el('a', 'post-author', post.author.displayName);
  author.href = profileUrl(post.author.username);
  const parts = [formatDate(post.createdAt), `${post.readingTime} dk okuma`];
  if (counts) parts.push(`${post.likeCount} beğeni`, `${post.commentCount} yorum`);
  meta.append(author, ` · ${parts.join(' · ')}`);
  return meta;
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
  if (post.category) badges.append(renderCategoryBadge(post.category));
  if (badges.childElementCount) body.append(badges);

  const title = el('h2', 'post-card-title');
  const titleLink = el('a', null, post.title);
  titleLink.href = postUrl(post.slug);
  title.append(titleLink);
  body.append(title);

  if (post.excerpt) body.append(el('p', 'post-card-excerpt', post.excerpt));

  const footer = el('div', 'post-card-footer');
  footer.append(renderMeta(post, { counts: post.status === 'PUBLISHED' }));
  if (showEdit) {
    const edit = el('a', 'btn btn-ghost btn-sm', 'Düzenle');
    edit.href = editorUrl(post.slug);
    footer.append(edit);
  }
  body.append(footer);

  if (post.tags.length) body.append(renderTagList(post.tags));

  card.append(body);
  return card;
}
