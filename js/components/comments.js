// İç içe yorumlar: listeleme, yorum yapma ve yanıtlama.
// Yorumlar düz metindir; DOM'a yalnızca textContent ile yazılır.

import { isLoggedIn } from '../auth.js';
import { createComment, listComments } from '../posts.js';
import { routes } from '../router.js';
import { profileUrl } from '../users.js';
import { renderAvatar } from './avatar.js';

const MAX_LENGTH = 2000;
/** Bu derinlikten sonra yanıtlar daha fazla içeri kaydırılmaz (dar ekranda okunabilirlik). */
const MAX_INDENT_DEPTH = 3;

const timeFormatter = new Intl.DateTimeFormat('tr-TR', {
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

/** parentId ile düz listeyi ağaca çevirir; üst yorumu bulunamayanlar köke eklenir. */
function buildTree(comments) {
  const nodes = new Map(comments.map((c) => [c.id, { ...c, replies: [] }]));
  const roots = [];
  for (const node of nodes.values()) {
    const parent = node.parentId && nodes.get(node.parentId);
    (parent ? parent.replies : roots).push(node);
  }
  return roots;
}

function commentForm({ placeholder, submitLabel, onSubmit, onCancel }) {
  const form = el('form', 'comment-form');
  form.noValidate = true;

  const textarea = el('textarea');
  textarea.name = 'content';
  textarea.rows = 3;
  textarea.maxLength = MAX_LENGTH;
  textarea.placeholder = placeholder;
  textarea.setAttribute('aria-label', placeholder);

  const error = el('p', 'form-error');
  error.setAttribute('role', 'alert');

  const actions = el('div', 'comment-form-actions');
  const submit = el('button', 'btn btn-primary btn-sm', submitLabel);
  submit.type = 'submit';
  if (onCancel) {
    const cancel = el('button', 'btn btn-ghost btn-sm', 'Vazgeç');
    cancel.type = 'button';
    cancel.addEventListener('click', onCancel);
    actions.append(cancel);
  }
  actions.append(submit);
  form.append(textarea, error, actions);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const content = textarea.value.trim();
    error.textContent = '';
    if (!content) {
      error.textContent = 'Yorum boş olamaz';
      textarea.focus();
      return;
    }
    submit.disabled = true;
    try {
      await onSubmit(content);
      textarea.value = '';
    } catch (err) {
      error.textContent = err.message;
    } finally {
      submit.disabled = false;
    }
  });

  return { form, textarea };
}

/**
 * container içine yorum bölümünü kurar.
 * onCountChange(n): yorum sayısı değiştiğinde çağrılır.
 */
export async function mountComments(container, postId, { onCountChange } = {}) {
  const loggedIn = isLoggedIn();
  let count = 0;

  const heading = el('h2', 'comments-title', 'Yorumlar');
  const list = el('ol', 'comment-list');
  const status = el('p', 'list-status', 'Yorumlar yükleniyor…');
  status.setAttribute('role', 'status');

  function setCount(value) {
    count = value;
    heading.textContent = `Yorumlar (${count})`;
    onCountChange?.(count);
  }

  function renderComment(comment, depth) {
    const item = el('li', 'comment');
    item.id = `yorum-${comment.id}`;

    const header = el('div', 'comment-header');
    const author = el('a', 'comment-author', comment.author.displayName);
    author.href = profileUrl(comment.author.username);
    const time = el('time', 'comment-time', timeFormatter.format(new Date(comment.createdAt)));
    time.dateTime = comment.createdAt;
    header.append(renderAvatar(comment.author, 32), author, time);

    const body = el('p', 'comment-body', comment.content);
    item.append(header, body);

    const replies = el('ol', 'comment-list comment-replies');
    if (depth >= MAX_INDENT_DEPTH) replies.classList.add('comment-replies-flat');

    if (loggedIn) {
      const replyButton = el('button', 'comment-reply-button', 'Yanıtla');
      replyButton.type = 'button';
      replyButton.addEventListener('click', () => {
        if (item.querySelector(':scope > .comment-form')) return;
        const { form, textarea } = commentForm({
          placeholder: `${comment.author.displayName} kişisine yanıt yaz…`,
          submitLabel: 'Yanıtla',
          onSubmit: async (content) => {
            const created = await createComment(postId, content, comment.id);
            replies.append(renderComment({ ...created, replies: [] }, depth + 1));
            form.remove();
            setCount(count + 1);
          },
          onCancel: () => form.remove(),
        });
        body.after(form);
        textarea.focus();
      });
      body.after(replyButton);
    }

    for (const reply of comment.replies) replies.append(renderComment(reply, depth + 1));
    item.append(replies);
    return item;
  }

  const top = loggedIn
    ? commentForm({
        placeholder: 'Düşüncelerini paylaş…',
        submitLabel: 'Yorum yap',
        onSubmit: async (content) => {
          const created = await createComment(postId, content);
          list.append(renderComment({ ...created, replies: [] }, 0));
          status.textContent = '';
          setCount(count + 1);
        },
      }).form
    : (() => {
        const note = el('p', 'comment-login');
        const link = el('a', null, 'Giriş yap');
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        link.href = `${routes.login}?next=${next}`;
        note.append(link, ' ve tartışmaya katıl.');
        return note;
      })();

  container.replaceChildren(heading, top, status, list);

  try {
    const comments = await listComments(postId);
    for (const root of buildTree(comments)) list.append(renderComment(root, 0));
    setCount(comments.length);
    status.textContent = comments.length ? '' : 'Henüz yorum yok. İlk yorumu sen yap!';
  } catch (error) {
    status.textContent = error.message;
  }
}
