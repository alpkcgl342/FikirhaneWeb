import { renderAvatar } from '../components/avatar.js';
import { initHeader, resetUnreadCount } from '../components/header.js';
import { listNotifications, markAllNotificationsRead } from '../moderation.js';
import { postUrl } from '../posts.js';
import { requireAuth } from '../router.js';
import { profileUrl } from '../users.js';

const list = document.getElementById('notification-list');
const status = document.getElementById('notification-status');
const more = document.getElementById('notification-more');

const timeFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function anchor(href, text) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  return a;
}

/** Bildirim cümlesi: "<Kişi> yazını beğendi: <Başlık>" gibi; tüm metinler textContent ile. */
function sentence(notification) {
  const { type, data } = notification;
  const p = document.createElement('p');
  const actor = anchor(profileUrl(data.actor.username), data.actor.displayName);

  if (type === 'FOLLOW') {
    p.append(actor, ' seni takip etmeye başladı.');
    return p;
  }

  const postLink = data.post
    ? anchor(
        `${postUrl(data.post.slug)}${data.commentId ? `#yorum-${data.commentId}` : ''}`,
        data.post.title,
      )
    : document.createTextNode('bir yazı');

  if (type === 'LIKE') {
    p.append(actor, ' yazını beğendi: ', postLink);
  } else if (data.reply) {
    p.append(actor, ' yorumuna yanıt verdi: ', postLink);
  } else {
    p.append(actor, ' yazına yorum yaptı: ', postLink);
  }
  return p;
}

function render(notification) {
  const item = document.createElement('li');
  item.className = `notification${notification.isRead ? '' : ' unread'}`;

  const body = document.createElement('div');
  body.className = 'notification-body';
  const time = document.createElement('time');
  time.className = 'notification-time';
  time.dateTime = notification.createdAt;
  time.textContent = timeFormatter.format(new Date(notification.createdAt));
  body.append(sentence(notification), time);

  item.append(renderAvatar(notification.data.actor, 40), body);
  return item;
}

let page = 0;

async function loadNext() {
  more.disabled = true;
  try {
    const result = await listNotifications(page + 1);
    page = result.page;
    for (const notification of result.items) list.append(render(notification));
    status.textContent = result.total === 0 ? 'Henüz bildirimin yok.' : '';
    more.hidden = page >= result.totalPages;

    // İlk sayfa gösterildikten sonra hepsi okundu sayılır (vurgu bu ziyarette kalır).
    if (page === 1 && result.unreadCount > 0) {
      await markAllNotificationsRead();
      resetUnreadCount();
    }
  } catch (error) {
    status.textContent = error.message;
  } finally {
    more.disabled = false;
  }
}

if (requireAuth()) {
  await initHeader();
  more.addEventListener('click', loadNext);
  await loadNext();
}
