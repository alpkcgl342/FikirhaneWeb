// Profil fotoğrafı; yoksa görünen adın baş harfi

export function renderAvatar(user, size = 40) {
  const box = document.createElement('span');
  box.className = 'avatar';
  box.style.setProperty('--avatar-size', `${size}px`);
  box.setAttribute('aria-hidden', 'true');

  if (user.avatarUrl) {
    const img = document.createElement('img');
    img.src = user.avatarUrl;
    img.alt = '';
    img.loading = 'lazy';
    box.append(img);
  } else {
    box.textContent = (user.displayName || user.username || '?').trim().charAt(0).toLocaleUpperCase('tr');
  }
  return box;
}
