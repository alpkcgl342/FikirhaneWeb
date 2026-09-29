// Bildirim, şikâyet ve yönetim (moderasyon) API çağrıları

import { api } from './api.js';
import { getCurrentUser } from './auth.js';

function toQuery(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

/** Oturumdaki kullanıcı moderatör ya da yönetici mi? (Asıl yetki kontrolü sunucudadır.) */
export function isModerator(user = getCurrentUser()) {
  return user?.role === 'MODERATOR' || user?.role === 'ADMIN';
}

export function isAdmin(user = getCurrentUser()) {
  return user?.role === 'ADMIN';
}

// Bildirimler
export function listNotifications(page = 1) {
  return api(`/notifications${toQuery({ page })}`, { auth: true });
}

export async function unreadNotificationCount() {
  const { unreadCount } = await api('/notifications/unread-count', { auth: true });
  return unreadCount;
}

export function markAllNotificationsRead() {
  return api('/notifications/read-all', { method: 'PATCH', auth: true });
}

// Şikâyet
export function createReport(targetType, targetId, reason) {
  return api('/reports', { method: 'POST', body: { targetType, targetId, reason }, auth: true });
}

// Yönetim
export function listReports(status = 'PENDING', page = 1) {
  return api(`/admin/reports${toQuery({ status, page })}`, { auth: true });
}

export function resolveReport(id, status) {
  return api(`/admin/reports/${id}`, { method: 'PATCH', body: { status }, auth: true });
}

export function removePost(id) {
  return api(`/admin/posts/${id}`, { method: 'DELETE', auth: true });
}

export function removeComment(id) {
  return api(`/admin/comments/${id}`, { method: 'DELETE', auth: true });
}

export function listUsers(q, page = 1) {
  return api(`/admin/users${toQuery({ q, page })}`, { auth: true });
}

export function setBan(userId, banned) {
  return api(`/admin/users/${userId}/ban`, { method: 'PATCH', body: { banned }, auth: true });
}

export function setRole(userId, role) {
  return api(`/admin/users/${userId}/role`, { method: 'PATCH', body: { role }, auth: true });
}

export const adminUrl = '/pages/admin.html';
export const notificationsUrl = '/pages/notifications.html';
