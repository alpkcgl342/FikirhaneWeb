// Profil ve takip API çağrıları

import { api } from './api.js';

export function getProfile(username) {
  return api(`/users/${encodeURIComponent(username)}`, { auth: true });
}

/** { displayName, bio, avatarUrl } — gönderilen alanlar güncellenir. Döner: { user } */
export function updateProfile(data) {
  return api('/users/me', { method: 'PATCH', body: data, auth: true });
}

/** { following, followerCount } */
export function toggleFollow(userId) {
  return api(`/users/${userId}/follow`, { method: 'POST', auth: true });
}

export function profileUrl(username) {
  return `/pages/profile.html?u=${encodeURIComponent(username)}`;
}
