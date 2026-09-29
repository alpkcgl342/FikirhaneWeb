import { renderAvatar } from '../components/avatar.js';
import { initHeader } from '../components/header.js';
import { mountPostList } from '../components/post-list.js';
import { searchPosts, searchUrl } from '../posts.js';
import { getQueryParam, redirect } from '../router.js';
import { profileUrl } from '../users.js';

const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const status = document.getElementById('search-status');
const userSection = document.getElementById('user-results-section');
const postSection = document.getElementById('post-results-section');

function renderUsers(users) {
  const list = document.getElementById('user-results');
  list.replaceChildren();
  for (const user of users) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'user-result';
    link.href = profileUrl(user.username);

    const text = document.createElement('span');
    text.className = 'user-result-text';
    const name = document.createElement('strong');
    name.textContent = user.displayName;
    const handle = document.createElement('span');
    handle.textContent = `@${user.username}`;
    text.append(name, handle);

    link.append(renderAvatar(user, 40), text);
    item.append(link);
    list.append(item);
  }
  userSection.hidden = users.length === 0;
}

function run(q) {
  document.title = `"${q}" araması — Fikirhane`;
  status.textContent = '';
  userSection.hidden = true;
  // Liste kendi "yükleniyor" ve hata mesajlarını gösterir; bu yüzden bölüm baştan görünür.
  postSection.hidden = false;

  const empty = document.createElement('p');
  empty.className = 'list-status';
  empty.textContent = 'Eşleşen yazı bulunamadı.';

  void mountPostList(document.getElementById('post-results'), {
    load: (page) => searchPosts(q, page),
    onFirstPage: (result) => {
      renderUsers(result.users);
      status.textContent =
        result.total || result.users.length
          ? `"${q}" için ${result.total} yazı bulundu.`
          : `"${q}" için sonuç bulunamadı.`;
    },
    emptyState: empty,
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const q = input.value.trim().replace(/\s+/g, ' ');
  if (q.length < 2) {
    status.textContent = 'En az 2 karakter yazın.';
    input.focus();
    return;
  }
  redirect(searchUrl(q));
});

void initHeader();

const q = (getQueryParam('q') ?? '').trim();
input.value = q;
if (q.length >= 2) run(q);
else input.focus();
