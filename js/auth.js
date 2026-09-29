// Kayıt, giriş, çıkış ve oturumdaki kullanıcı

import { api, tokenStore } from './api.js';

const USER_KEY = 'fikirhane.user';

function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Tarayıcıda kayıtlı kullanıcıyı döner (sunucuya gitmez). */
export function getCurrentUser() {
  if (!tokenStore.get()) return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(tokenStore.get());
}

export async function register({ email, password, username, displayName }) {
  const result = await api('/auth/register', {
    method: 'POST',
    body: { email, password, username, displayName },
  });
  if (result.session) {
    tokenStore.set(result.session);
    saveUser(result.user);
  }
  return result;
}

export async function login(email, password) {
  const result = await api('/auth/login', { method: 'POST', body: { email, password } });
  tokenStore.set(result.session);
  saveUser(result.user);
  return result.user;
}

export function resendConfirmation(email) {
  return api('/auth/resend-confirmation', { method: 'POST', body: { email } });
}

export function logout() {
  tokenStore.clear();
  localStorage.removeItem(USER_KEY);
}

/** Oturumu sunucuda doğrular ve kullanıcı bilgisini tazeler. */
export async function refreshCurrentUser() {
  if (!isLoggedIn()) return null;
  try {
    const { user } = await api('/auth/me', { auth: true });
    saveUser(user);
    return user;
  } catch (error) {
    if (error.status === 401) {
      logout();
      return null;
    }
    // Ağ hatasında kayıtlı kullanıcıyla devam edilir.
    return getCurrentUser();
  }
}
