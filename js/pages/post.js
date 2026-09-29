import { isLoggedIn } from '../auth.js';
import { mountComments } from '../components/comments.js';
import { showAlert } from '../components/form.js';
import { initHeader } from '../components/header.js';
import { renderMeta } from '../components/post-card.js';
import { renderMarkdown } from '../markdown.js';
import { deletePost, editorUrl, getPost, toggleBookmark, toggleLike } from '../posts.js';
import { getQueryParam, redirect, routes } from '../router.js';

const message = document.getElementById('post-message');
const article = document.getElementById('post');

function badge(text, extraClass = '') {
  const span = document.createElement('span');
  span.className = `badge ${extraClass}`.trim();
  span.textContent = text;
  return span;
}

function loginRedirect() {
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  redirect(`${routes.login}?next=${next}`);
}

function setLikeState(button, liked, count) {
  button.setAttribute('aria-pressed', String(liked));
  button.querySelector('[data-label]').textContent = liked ? 'Beğenildi' : 'Beğen';
  button.querySelector('[data-count]').textContent = String(count);
}

function setBookmarkState(button, bookmarked) {
  button.setAttribute('aria-pressed', String(bookmarked));
  button.querySelector('[data-label]').textContent = bookmarked ? 'Kaydedildi' : 'Kaydet';
}

/** Beğen/kaydet: giriş yapmamış kullanıcı giriş sayfasına yönlendirilir. */
function initActions(post) {
  const likeButton = document.getElementById('like-button');
  const bookmarkButton = document.getElementById('bookmark-button');
  const status = document.getElementById('action-status');

  setLikeState(likeButton, post.likedByMe, post.likeCount);
  setBookmarkState(bookmarkButton, post.bookmarkedByMe);

  likeButton.addEventListener('click', async () => {
    if (!isLoggedIn()) return loginRedirect();
    likeButton.disabled = true;
    status.textContent = '';
    try {
      const { liked, likeCount } = await toggleLike(post.id);
      setLikeState(likeButton, liked, likeCount);
    } catch (error) {
      status.textContent = error.message;
    } finally {
      likeButton.disabled = false;
    }
  });

  bookmarkButton.addEventListener('click', async () => {
    if (!isLoggedIn()) return loginRedirect();
    bookmarkButton.disabled = true;
    status.textContent = '';
    try {
      const { bookmarked } = await toggleBookmark(post.id);
      setBookmarkState(bookmarkButton, bookmarked);
    } catch (error) {
      status.textContent = error.message;
    } finally {
      bookmarkButton.disabled = false;
    }
  });

  document.getElementById('post-actions').hidden = false;
}

function initOwnerActions(post) {
  document.getElementById('post-edit').href = editorUrl(post.slug);
  document.getElementById('post-owner-actions').hidden = false;
  const deleteButton = document.getElementById('post-delete');
  deleteButton.addEventListener('click', async () => {
    if (!window.confirm('Bu yazıyı silmek istediğine emin misin? Bu işlem geri alınamaz.')) return;
    deleteButton.disabled = true;
    try {
      await deletePost(post.id);
      redirect(routes.myPosts);
    } catch (error) {
      showAlert(document.getElementById('post-alert'), error.message);
      deleteButton.disabled = false;
    }
  });
}

function render(post) {
  document.title = `${post.title} — Fikirhane`;

  const cover = document.getElementById('post-cover');
  if (post.coverUrl) {
    cover.src = post.coverUrl;
    cover.hidden = false;
  }

  const badges = document.getElementById('post-badges');
  if (post.status === 'DRAFT') badges.append(badge('Taslak — yalnızca sen görüyorsun', 'badge-draft'));
  if (post.category) badges.append(badge(post.category.name));

  document.getElementById('post-title').textContent = post.title;
  document.getElementById('post-meta').replaceChildren(renderMeta(post));

  // renderMarkdown çıktısı DOMPurify ile temizlenmiştir.
  document.getElementById('post-content').innerHTML = renderMarkdown(post.content);

  if (post.tags.length) {
    const list = document.querySelector('#post-tags .tag-list');
    for (const tag of post.tags) {
      const li = document.createElement('li');
      li.className = 'tag';
      li.textContent = `#${tag}`;
      list.append(li);
    }
    document.getElementById('post-tags').hidden = false;
  }

  if (post.isOwner) initOwnerActions(post);

  // Beğeni, kaydetme ve yorumlar yalnızca yayındaki yazılarda vardır.
  if (post.status === 'PUBLISHED') {
    initActions(post);
    const comments = document.getElementById('comments');
    comments.hidden = false;
    void mountComments(comments, post.id);
  }

  message.hidden = true;
  article.hidden = false;
}

async function init() {
  void initHeader();
  const slug = getQueryParam('slug');
  if (!slug) {
    message.textContent = 'Yazı bulunamadı.';
    return;
  }
  try {
    render(await getPost(slug));
  } catch (error) {
    message.textContent = error.status === 404 ? 'Yazı bulunamadı.' : error.message;
  }
}

void init();
