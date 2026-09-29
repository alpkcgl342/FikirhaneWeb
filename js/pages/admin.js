// Yönetim paneli: şikâyetler ve kullanıcılar. Tüm metinler textContent ile yazılır.
// Asıl yetki kontrolü sunucudadır; buradaki kontroller yalnızca arayüzü düzenler.

import { getCurrentUser } from '../auth.js';
import { renderAvatar } from '../components/avatar.js';
import { initHeader } from '../components/header.js';
import {
  isAdmin,
  isModerator,
  listReports,
  listUsers,
  removeComment,
  removePost,
  resolveReport,
  setBan,
  setRole,
} from '../moderation.js';
import { postUrl } from '../posts.js';
import { requireAuth } from '../router.js';
import { profileUrl } from '../users.js';

const TYPE_LABELS = { POST: 'Yazı', COMMENT: 'Yorum', USER: 'Kullanıcı' };
const STATUS_LABELS = { PENDING: 'Bekliyor', RESOLVED: 'Çözüldü', DISMISSED: 'Reddedildi' };
const ROLE_LABELS = { USER: 'Kullanıcı', MODERATOR: 'Moderatör', ADMIN: 'Yönetici' };

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function anchor(href, text) {
  const a = el('a', null, text);
  a.href = href;
  return a;
}

function button(text, className, onClick) {
  const b = el('button', `btn btn-sm ${className}`, text);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

/** Butonu kilitleyip işlemi çalıştırır; hata olursa kart içinde gösterir. */
async function run(card, trigger, action) {
  const error = card.querySelector('.form-error');
  error.textContent = '';
  card.querySelectorAll('button, select').forEach((b) => {
    b.disabled = true;
  });
  try {
    await action();
  } catch (err) {
    error.textContent = err.message;
  } finally {
    card.querySelectorAll('button, select').forEach((b) => {
      b.disabled = false;
    });
  }
}

/* ---------- Şikâyetler ---------- */

let reportState = { status: 'PENDING', page: 0 };
const reportList = document.getElementById('report-list');
const reportStatus = document.getElementById('report-status');
const reportMore = document.getElementById('report-more');

function targetPreview(report) {
  const box = el('div', 'admin-target');
  const t = report.target;
  if (!t) {
    box.append(el('p', null, 'İçerik artık yok (silinmiş).'));
    return box;
  }
  if (report.targetType === 'POST') {
    const p = el('p');
    p.append(anchor(postUrl(t.slug), t.title), ' — ', anchor(profileUrl(t.author.username), t.author.displayName));
    box.append(p);
  } else if (report.targetType === 'COMMENT') {
    const content = t.content.length > 300 ? `${t.content.slice(0, 300)}…` : t.content;
    const p = el('p', null, `“${content}”`);
    const meta = el('p', 'admin-card-meta');
    meta.append(
      anchor(profileUrl(t.author.username), t.author.displayName),
      ' · ',
      anchor(`${postUrl(t.post.slug)}#yorum-${t.id}`, t.post.title),
    );
    box.append(p, meta);
  } else {
    const p = el('p');
    p.append(anchor(profileUrl(t.username), `${t.displayName} (@${t.username})`));
    if (t.isBanned) p.append(' · ', el('span', 'badge badge-draft', 'Engelli'));
    box.append(p);
  }
  return box;
}

function renderReport(report) {
  const card = el('li', 'admin-card');

  const meta = el('div', 'admin-card-meta');
  meta.append(
    el('span', 'badge', TYPE_LABELS[report.targetType]),
    el('span', null, dateFormatter.format(new Date(report.createdAt))),
    el('span', null, '· Şikâyet eden:'),
    anchor(profileUrl(report.reporter.username), report.reporter.displayName),
  );
  if (report.status !== 'PENDING') meta.append(el('span', 'badge badge-draft', STATUS_LABELS[report.status]));

  card.append(meta, el('p', 'admin-reason', report.reason), targetPreview(report));

  if (report.status === 'PENDING') {
    const actions = el('div', 'admin-actions');
    const done = () => {
      card.remove();
      if (!reportList.childElementCount) reportStatus.textContent = 'Bekleyen şikâyet kalmadı.';
    };
    const t = report.target;

    if (t && report.targetType === 'POST') {
      actions.append(
        button('Yazıyı kaldır', 'btn-danger', (e) =>
          run(card, e.currentTarget, async () => {
            if (!window.confirm('Yazı kalıcı olarak kaldırılacak. Emin misin?')) return;
            await removePost(t.id);
            done();
          }),
        ),
      );
    }
    if (t && report.targetType === 'COMMENT') {
      actions.append(
        button('Yorumu kaldır', 'btn-danger', (e) =>
          run(card, e.currentTarget, async () => {
            if (!window.confirm('Yorum ve yanıtları kaldırılacak. Emin misin?')) return;
            await removeComment(t.id);
            done();
          }),
        ),
      );
    }
    const person = report.targetType === 'USER' ? t : t?.author;
    if (person && !(report.targetType === 'USER' && t.isBanned)) {
      actions.append(
        button(report.targetType === 'USER' ? 'Kullanıcıyı engelle' : 'Yazarı engelle', 'btn-danger', (e) =>
          run(card, e.currentTarget, async () => {
            if (!window.confirm(`${person.displayName} engellensin mi?`)) return;
            await setBan(person.id, true);
            // Kullanıcı şikâyeti engellemeyle birlikte sunucuda çözülür.
            if (report.targetType === 'USER') done();
            else e.target.replaceWith(el('span', 'badge badge-draft', 'Yazar engellendi'));
          }),
        ),
      );
    }
    actions.append(
      button('Çözüldü', 'btn-ghost', (e) =>
        run(card, e.currentTarget, async () => {
          await resolveReport(report.id, 'RESOLVED');
          done();
        }),
      ),
      button('Reddet', 'btn-ghost', (e) =>
        run(card, e.currentTarget, async () => {
          await resolveReport(report.id, 'DISMISSED');
          done();
        }),
      ),
    );
    card.append(actions);
  }

  card.append(el('p', 'form-error'));
  return card;
}

async function loadReports(reset = false) {
  if (reset) {
    reportState.page = 0;
    reportList.replaceChildren();
  }
  const requested = reportState.status;
  reportMore.disabled = true;
  reportStatus.textContent = reportState.page === 0 ? 'Şikâyetler yükleniyor…' : '';
  try {
    const result = await listReports(requested, reportState.page + 1);
    if (requested !== reportState.status) return; // Bu arada sekme değişti
    reportState.page = result.page;
    for (const report of result.items) reportList.append(renderReport(report));
    reportStatus.textContent = result.total === 0 ? 'Bu durumda şikâyet yok.' : '';
    reportMore.hidden = result.page >= result.totalPages;
  } catch (error) {
    reportStatus.textContent = error.message;
  } finally {
    reportMore.disabled = false;
  }
}

/* ---------- Kullanıcılar ---------- */

let userState = { q: '', page: 0 };
const userList = document.getElementById('user-list');
const userStatus = document.getElementById('user-status');
const userMore = document.getElementById('user-more');

function renderUser(user) {
  const me = getCurrentUser();
  const card = el('li', 'admin-card');
  const row = el('div', 'user-row');

  const info = el('div', 'user-row-info');
  info.append(anchor(profileUrl(user.username), user.displayName), el('span', null, `@${user.username} · ${user.email}`));
  row.append(renderAvatar(user, 40), info);

  const isSelf = user.id === me?.id;
  // Rol: yalnızca yönetici, kendisi dışındakiler için değiştirebilir.
  if (isAdmin() && !isSelf) {
    const select = el('select');
    select.setAttribute('aria-label', `${user.displayName} rolü`);
    for (const [value, label] of Object.entries(ROLE_LABELS)) {
      const option = el('option', null, label);
      option.value = value;
      option.selected = value === user.role;
      select.append(option);
    }
    select.addEventListener('change', () =>
      run(card, select, async () => {
        try {
          await setRole(user.id, select.value);
          user.role = select.value;
        } catch (error) {
          select.value = user.role;
          throw error;
        }
      }),
    );
    row.append(select);
  } else {
    row.append(el('span', 'badge', ROLE_LABELS[user.role]));
  }

  if (!isSelf && user.role !== 'ADMIN') {
    const banButton = button(user.isBanned ? 'Engeli kaldır' : 'Engelle', user.isBanned ? 'btn-ghost' : 'btn-danger', () =>
      run(card, banButton, async () => {
        const banned = !user.isBanned;
        if (banned && !window.confirm(`${user.displayName} engellensin mi?`)) return;
        await setBan(user.id, banned);
        user.isBanned = banned;
        card.replaceWith(renderUser(user));
      }),
    );
    row.append(banButton);
  }
  if (user.isBanned) row.append(el('span', 'badge badge-draft', 'Engelli'));

  card.append(row, el('p', 'form-error'));
  return card;
}

async function loadUsers(reset = false) {
  if (reset) {
    userState.page = 0;
    userList.replaceChildren();
  }
  const requested = userState.q;
  userMore.disabled = true;
  userStatus.textContent = userState.page === 0 ? 'Kullanıcılar yükleniyor…' : '';
  try {
    const result = await listUsers(requested, userState.page + 1);
    if (requested !== userState.q) return;
    userState.page = result.page;
    for (const user of result.items) userList.append(renderUser(user));
    userStatus.textContent = result.total === 0 ? 'Kullanıcı bulunamadı.' : '';
    userMore.hidden = result.page >= result.totalPages;
  } catch (error) {
    userStatus.textContent = error.message;
  } finally {
    userMore.disabled = false;
  }
}

/* ---------- Kurulum ---------- */

function selectTab(tabs, active) {
  for (const tab of tabs) tab.setAttribute('aria-selected', String(tab === active));
}

async function init() {
  // Rolün güncel olması için başlık (ve /auth/me) önce yüklenir.
  await initHeader();
  const message = document.getElementById('admin-message');
  if (!isModerator()) {
    message.textContent = 'Bu sayfaya erişim yetkin yok.';
    return;
  }
  message.hidden = true;
  document.getElementById('admin').hidden = false;

  const sectionTabs = document.querySelectorAll('[data-section]');
  let usersLoaded = false;
  for (const tab of sectionTabs) {
    tab.addEventListener('click', () => {
      selectTab(sectionTabs, tab);
      const section = tab.dataset.section;
      document.getElementById('section-reports').hidden = section !== 'reports';
      document.getElementById('section-users').hidden = section !== 'users';
      if (section === 'users' && !usersLoaded) {
        usersLoaded = true;
        void loadUsers(true);
      }
    });
  }

  const statusTabs = document.querySelectorAll('[data-status]');
  for (const tab of statusTabs) {
    tab.addEventListener('click', () => {
      selectTab(statusTabs, tab);
      reportState.status = tab.dataset.status;
      void loadReports(true);
    });
  }
  reportMore.addEventListener('click', () => loadReports());

  document.getElementById('user-search').addEventListener('submit', (event) => {
    event.preventDefault();
    userState.q = event.currentTarget.q.value.trim();
    void loadUsers(true);
  });
  userMore.addEventListener('click', () => loadUsers());

  await loadReports(true);
}

if (requireAuth()) void init();
