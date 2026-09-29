import { getCurrentUser } from '../auth.js';
import { initHeader } from '../components/header.js';
import { mountPostList } from '../components/post-list.js';
import { routes } from '../router.js';

function emptyState() {
  const box = document.createElement('div');
  box.className = 'card empty-state';
  const text = document.createElement('p');
  text.textContent = 'Henüz yayınlanmış bir yazı yok. İlk yazıyı sen yaz!';
  const link = document.createElement('a');
  link.className = 'btn btn-primary';
  link.href = routes.editor;
  link.textContent = 'Yazmaya başla';
  box.append(text, link);
  return box;
}

void mountPostList(document.getElementById('latest-posts'), { emptyState: emptyState() });
await initHeader();

// Giriş yapmış kullanıcıya kayıt çağrısı yerine karşılama göster.
const user = getCurrentUser();
if (user) {
  document.querySelector('[data-guest-only]')?.setAttribute('hidden', '');
  const welcome = document.querySelector('[data-welcome]');
  if (welcome) {
    welcome.textContent = `Hoş geldin, ${user.displayName}!`;
    welcome.hidden = false;
  }
}
