// fetch sarmalayıcısı ve token yönetimi

import { API_BASE } from './config.js';

const SESSION_KEY = 'fikirhane.session';
// Access token'ın süresi dolmadan bu kadar saniye önce yenilenir.
const REFRESH_MARGIN_SECONDS = 60;

export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const tokenStore = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  },
  set(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },
  clear() {
    localStorage.removeItem(SESSION_KEY);
  },
};

function isExpiringSoon(session) {
  if (!session?.expiresAt) return false;
  return session.expiresAt - Date.now() / 1000 < REFRESH_MARGIN_SECONDS;
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toApiError(status, body) {
  const message = body?.message;
  if (Array.isArray(message)) {
    return new ApiError(status, message[0], message);
  }
  return new ApiError(status, message || 'Beklenmeyen bir hata oluştu');
}

// Aynı anda birden fazla istek 401 alırsa tek bir yenileme isteği yapılır.
let refreshPromise = null;

async function refreshSession() {
  const current = tokenStore.get();
  if (!current?.refreshToken) return null;

  refreshPromise ??= (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
      const body = await parseBody(response);
      if (!response.ok) {
        // Yalnızca sunucu oturumu reddettiyse çıkış yapılır; ağ hatasında oturum korunur.
        if (response.status === 401) tokenStore.clear();
        return null;
      }
      tokenStore.set(body.session);
      return body.session;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * API'ye istek atar. `auth: true` ise access token eklenir ve gerekirse yenilenir.
 * Başarısız yanıtlarda ApiError fırlatır.
 */
export async function api(path, { method = 'GET', body, auth = false } = {}) {
  const send = (session) => {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
    return fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let session = auth ? tokenStore.get() : null;
  if (auth && isExpiringSoon(session)) {
    session = (await refreshSession()) ?? tokenStore.get();
  }

  let response;
  try {
    response = await send(session);
    if (auth && response.status === 401 && session?.refreshToken) {
      const refreshed = await refreshSession();
      if (refreshed) response = await send(refreshed);
    }
  } catch {
    throw new ApiError(0, 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.');
  }

  const data = await parseBody(response);
  if (!response.ok) throw toApiError(response.status, data);
  return data;
}
