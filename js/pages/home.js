import { getCurrentUser } from '../auth.js';
import { initHeader } from '../components/header.js';

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
