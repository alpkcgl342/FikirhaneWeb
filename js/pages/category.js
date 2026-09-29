// Kategori (?slug=) ve etiket (?tag=) sayfası

import { initHeader } from '../components/header.js';
import { mountPostList } from '../components/post-list.js';
import { categoryUrl, listCategories } from '../posts.js';
import { getQueryParam } from '../router.js';

const kindLabel = document.getElementById('listing-kind');
const title = document.getElementById('listing-title');
const description = document.getElementById('listing-description');

function emptyState() {
  const box = document.createElement('div');
  box.className = 'card empty-state';
  const text = document.createElement('p');
  text.textContent = 'Burada henüz yayınlanmış bir yazı yok.';
  box.append(text);
  return box;
}

function mountSortTabs(baseParams) {
  const tabs = document.querySelectorAll('[data-sort]');
  const show = (sort) => {
    for (const tab of tabs) tab.setAttribute('aria-selected', String(tab.dataset.sort === sort));
    void mountPostList(document.getElementById('listing-posts'), {
      params: { ...baseParams, sort },
      emptyState: emptyState(),
    });
  };
  for (const tab of tabs) tab.addEventListener('click', () => show(tab.dataset.sort));
  show('new');
}

function renderCategoryNav(categories, current) {
  const nav = document.getElementById('category-nav');
  for (const category of categories) {
    const link = document.createElement('a');
    link.className = 'badge';
    link.href = categoryUrl(category.slug);
    link.textContent = category.name;
    if (category.slug === current) link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
}

function notFound(text) {
  title.textContent = text;
  document.querySelector('.filter-tabs').hidden = true;
}

async function init() {
  void initHeader();
  const slug = getQueryParam('slug');
  const tag = getQueryParam('tag');

  if (tag) {
    kindLabel.textContent = 'Etiket';
    title.textContent = `#${tag}`;
    document.title = `#${tag} — Fikirhane`;
    mountSortTabs({ tag });
    return;
  }

  if (!slug) return notFound('Konu bulunamadı');

  let categories;
  try {
    categories = await listCategories();
  } catch (error) {
    return notFound(error.message);
  }
  const category = categories.find((c) => c.slug === slug);
  if (!category) return notFound('Kategori bulunamadı');

  kindLabel.textContent = 'Kategori';
  title.textContent = category.name;
  description.textContent = category.description ?? '';
  document.title = `${category.name} — Fikirhane`;
  renderCategoryNav(categories, slug);
  mountSortTabs({ category: slug });
}

void init();
