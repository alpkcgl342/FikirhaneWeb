import { getCurrentUser, isLoggedIn, saveUser } from '../auth.js';
import { renderAvatar } from '../components/avatar.js';
import { clearErrors, hideAlert, setFieldError, showAlert } from '../components/form.js';
import { initHeader } from '../components/header.js';
import { mountPostList } from '../components/post-list.js';
import { prepareImage } from '../image-resize.js';
import { uploadImage } from '../posts.js';
import { getQueryParam, redirect, routes } from '../router.js';
import { getProfile, profileUrl, toggleFollow, updateProfile } from '../users.js';

const message = document.getElementById('profile-message');
const form = document.getElementById('profile-form');
const formAlert = document.getElementById('profile-alert');
const followButton = document.getElementById('follow-button');
const editButton = document.getElementById('edit-button');

const joinedFormatter = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' });

let profile = null;
let draftAvatarUrl = null; // Düzenleme formundaki (henüz kaydedilmemiş) fotoğraf

function renderProfile() {
  document.title = `${profile.displayName} (@${profile.username}) — Fikirhane`;
  document.getElementById('profile-avatar').replaceChildren(renderAvatar(profile, 96));
  document.getElementById('profile-name').textContent = profile.displayName;
  document.getElementById('profile-username').textContent = `@${profile.username}`;
  document.getElementById('profile-bio').textContent = profile.bio ?? '';
  document.getElementById('stat-posts').textContent = String(profile.postCount);
  document.getElementById('stat-followers').textContent = String(profile.followerCount);
  document.getElementById('stat-following').textContent = String(profile.followingCount);
  document.getElementById('profile-joined').textContent =
    `${joinedFormatter.format(new Date(profile.createdAt))} tarihinde katıldı`;

  if (profile.isMe) {
    editButton.hidden = false;
    followButton.hidden = true;
  } else {
    followButton.hidden = false;
    followButton.setAttribute('aria-pressed', String(profile.isFollowing));
    followButton.textContent = profile.isFollowing ? 'Takibi bırak' : 'Takip et';
  }
}

function renderAvatarPreview() {
  document
    .getElementById('avatar-preview')
    .replaceChildren(renderAvatar({ ...profile, avatarUrl: draftAvatarUrl }, 64));
  document.getElementById('avatar-remove').hidden = !draftAvatarUrl;
}

function openForm() {
  draftAvatarUrl = profile.avatarUrl;
  form.displayName.value = profile.displayName;
  form.bio.value = profile.bio ?? '';
  clearErrors(form);
  hideAlert(formAlert);
  renderAvatarPreview();
  form.hidden = false;
  editButton.hidden = true;
  form.displayName.focus();
}

function closeForm() {
  form.hidden = true;
  editButton.hidden = false;
}

async function handleFollow() {
  if (!isLoggedIn()) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    redirect(`${routes.login}?next=${next}`);
    return;
  }
  const status = document.getElementById('follow-status');
  followButton.disabled = true;
  status.textContent = '';
  try {
    const { following, followerCount } = await toggleFollow(profile.id);
    profile = { ...profile, isFollowing: following, followerCount };
    renderProfile();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    followButton.disabled = false;
  }
}

async function handleAvatarChange(event) {
  const input = event.currentTarget;
  const file = input.files[0];
  input.value = '';
  if (!file) return;
  const status = document.getElementById('avatar-status');
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  status.textContent = 'Fotoğraf yükleniyor…';
  try {
    const { blob, filename } = await prepareImage(file);
    draftAvatarUrl = await uploadImage(blob, filename);
    renderAvatarPreview();
    status.textContent = '';
  } catch (error) {
    status.textContent = error.message;
  } finally {
    submit.disabled = false;
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  clearErrors(form);
  hideAlert(formAlert);

  const displayName = form.displayName.value.trim();
  const bio = form.bio.value.trim();
  if (!displayName) {
    setFieldError(form, 'displayName', 'Görünen ad gerekli');
    form.displayName.focus();
    return;
  }

  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    const { user } = await updateProfile({ displayName, bio, avatarUrl: draftAvatarUrl });
    saveUser(user); // Üst menüdeki ad da güncellensin
    profile = { ...profile, displayName: user.displayName, bio: user.bio, avatarUrl: user.avatarUrl };
    renderProfile();
    closeForm();
    void initHeader();
  } catch (error) {
    showAlert(formAlert, error.message);
  } finally {
    submit.disabled = false;
  }
}

async function init() {
  void initHeader();

  const username = getQueryParam('u');
  if (!username) {
    // /pages/profile.html → giriş yapmışsa kendi profili
    const me = getCurrentUser();
    if (me) window.location.replace(profileUrl(me.username));
    else message.textContent = 'Kullanıcı bulunamadı.';
    return;
  }

  try {
    profile = await getProfile(username);
  } catch (error) {
    message.textContent = error.status === 404 ? 'Kullanıcı bulunamadı.' : error.message;
    return;
  }

  renderProfile();
  message.hidden = true;
  document.getElementById('profile').hidden = false;

  followButton.addEventListener('click', handleFollow);
  editButton.addEventListener('click', openForm);
  document.getElementById('cancel-button').addEventListener('click', closeForm);
  document.getElementById('avatar-input').addEventListener('change', handleAvatarChange);
  document.getElementById('avatar-remove').addEventListener('click', () => {
    draftAvatarUrl = null;
    renderAvatarPreview();
  });
  form.addEventListener('submit', handleSubmit);

  const empty = document.createElement('p');
  empty.className = 'list-status';
  empty.textContent = profile.isMe ? 'Henüz yayınlanmış yazın yok.' : 'Henüz yayınlanmış yazısı yok.';
  void mountPostList(document.getElementById('profile-posts'), {
    params: { author: profile.username },
    emptyState: empty,
  });
}

void init();
