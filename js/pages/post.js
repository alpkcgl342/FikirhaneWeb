import { showAlert } from '../components/form.js';
import { initHeader } from '../components/header.js';
import { formatDate } from '../components/post-card.js';
import { renderMarkdown } from '../markdown.js';
import { deletePost, editorUrl, getPost } from '../posts.js';
import { getQueryParam, redirect, routes } from '../router.js';

const message = document.getElementById('post-message');
const article = document.getElementById('post');

function badge(text, extraClass = '') {
  const span = document.createElement('span');
  span.className = `badge ${extraClass}`.trim();
  span.textContent = text;
  return span;
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
  document.getElementById('post-meta').textContent = [
    `${post.author.displayName} (@${post.author.username})`,
    formatDate(post.createdAt),
    `${post.readingTime} dk okuma`,
  ].join(' · ');

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

  if (post.isOwner) {
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
