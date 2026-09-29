import { initHeader } from '../components/header.js';
import { clearErrors, hideAlert, setFieldError, showAlert } from '../components/form.js';
import { prepareImage } from '../image-resize.js';
import { estimateReadingTime, renderMarkdown } from '../markdown.js';
import {
  createPost,
  deletePost,
  editorUrl,
  getPost,
  listCategories,
  postUrl,
  updatePost,
  uploadImage,
} from '../posts.js';
import { getQueryParam, redirect, requireAuth, routes } from '../router.js';

const MAX_TAGS = 5;
const TAG_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} -]*$/u;

const form = document.getElementById('editor-form');
const alertBox = document.getElementById('editor-alert');
const heading = document.getElementById('editor-heading');
const statusLabel = document.getElementById('editor-status');
const categorySelect = form.categoryId;
const contentInput = form.content;
const preview = document.getElementById('preview');
const readingTimeLabel = document.getElementById('reading-time');
const coverInput = document.getElementById('cover-input');
const coverPreview = document.getElementById('cover-preview');
const coverRemove = document.getElementById('cover-remove');
const coverStatus = document.getElementById('cover-status');
const draftButton = document.getElementById('draft-button');
const publishButton = document.getElementById('publish-button');
const deleteButton = document.getElementById('delete-button');

let post = null; // Düzenlenen yazı (yeni yazıda null)
let coverUrl = null;
let dirty = false;
let busy = false;

function parseTags(value) {
  return value
    .split(',')
    .map((tag) => tag.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
}

function validate(values) {
  const errors = {};
  if (values.title.length < 3) errors.title = 'Başlık en az 3 karakter olmalı';
  if (!values.content.trim()) errors.content = 'İçerik boş olamaz';
  if (values.tags.length > MAX_TAGS) {
    errors.tags = `En fazla ${MAX_TAGS} etiket eklenebilir`;
  } else if (values.tags.some((tag) => tag.length < 2 || tag.length > 30)) {
    errors.tags = 'Her etiket 2-30 karakter olmalı';
  } else if (values.tags.some((tag) => !TAG_PATTERN.test(tag))) {
    errors.tags = 'Etiketler yalnızca harf, rakam, boşluk ve - içerebilir';
  }
  return errors;
}

function setBusy(value) {
  busy = value;
  for (const button of [draftButton, publishButton, deleteButton]) button.disabled = value;
}

function setCover(url) {
  coverUrl = url;
  coverPreview.hidden = !url;
  coverRemove.hidden = !url;
  if (url) coverPreview.src = url;
  else coverPreview.removeAttribute('src');
}

// Önizleme ve okuma süresi, yazarken kısa bir gecikmeyle güncellenir.
let previewTimer;
function updatePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    preview.innerHTML = renderMarkdown(contentInput.value);
    readingTimeLabel.textContent = `Tahmini okuma süresi: ${estimateReadingTime(contentInput.value)} dk`;
  }, 150);
}

/** Yazının durumuna göre başlık ve buton metinlerini ayarlar. */
function applyMode() {
  if (!post) return;
  heading.textContent = 'Yazıyı düzenle';
  deleteButton.hidden = false;
  if (post.status === 'PUBLISHED') {
    statusLabel.textContent = 'Yayında';
    draftButton.textContent = 'Yayından kaldır';
    publishButton.textContent = 'Güncelle';
  } else {
    statusLabel.textContent = 'Taslak';
    draftButton.textContent = 'Taslağı kaydet';
    publishButton.textContent = 'Yayınla';
  }
}

function fillForm(data) {
  form.title.value = data.title;
  categorySelect.value = data.category?.id ?? '';
  form.tags.value = data.tags.join(', ');
  contentInput.value = data.content;
  setCover(data.coverUrl);
  updatePreview();
}

async function loadCategories() {
  try {
    for (const category of await listCategories()) {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.append(option);
    }
  } catch {
    // Kategoriler yüklenemezse yazı kategorisiz kaydedilebilir.
  }
}

async function loadPost(slug) {
  try {
    const data = await getPost(slug);
    if (!data.isOwner) {
      showAlert(alertBox, 'Bu yazıyı düzenleme yetkiniz yok.');
      form.querySelectorAll('input, select, textarea, button').forEach((el) => {
        el.disabled = true;
      });
      return;
    }
    post = data;
    fillForm(data);
    applyMode();
    document.title = `${data.title} — Düzenle — Fikirhane`;
  } catch (error) {
    showAlert(alertBox, error.message);
  }
}

async function handleCoverChange() {
  const file = coverInput.files[0];
  coverInput.value = '';
  if (!file) return;

  coverStatus.textContent = 'Görsel hazırlanıyor…';
  setBusy(true);
  try {
    const { blob, filename } = await prepareImage(file);
    coverStatus.textContent = 'Görsel yükleniyor…';
    setCover(await uploadImage(blob, filename));
    coverStatus.textContent = '';
    dirty = true;
  } catch (error) {
    coverStatus.textContent = error.message;
  } finally {
    setBusy(false);
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  if (busy) return;
  clearErrors(form);
  hideAlert(alertBox);

  const status = event.submitter?.dataset.status ?? 'DRAFT';
  const values = {
    title: form.title.value.trim(),
    content: contentInput.value,
    categoryId: categorySelect.value || null,
    tags: parseTags(form.tags.value),
    coverUrl,
    status,
  };

  const errors = validate(values);
  if (Object.keys(errors).length > 0) {
    for (const [name, message] of Object.entries(errors)) setFieldError(form, name, message);
    form.elements.namedItem(Object.keys(errors)[0])?.focus();
    return;
  }

  setBusy(true);
  try {
    const saved = post ? await updatePost(post.id, values) : await createPost(values);
    dirty = false;
    if (saved.status === 'PUBLISHED') {
      redirect(postUrl(saved.slug));
      return;
    }
    if (!post) {
      // Sonraki kayıtlar güncelleme olsun diye düzenleme adresine geçilir.
      window.location.replace(`${editorUrl(saved.slug)}&saved=1`);
      return;
    }
    post = saved;
    applyMode();
    showAlert(alertBox, 'Taslak kaydedildi.', 'success');
  } catch (error) {
    showAlert(alertBox, error.message);
  } finally {
    setBusy(false);
  }
}

async function handleDelete() {
  if (!post || busy) return;
  if (!window.confirm('Bu yazıyı silmek istediğine emin misin? Bu işlem geri alınamaz.')) return;

  setBusy(true);
  try {
    await deletePost(post.id);
    dirty = false;
    redirect(routes.myPosts);
  } catch (error) {
    showAlert(alertBox, error.message);
    setBusy(false);
  }
}

function initTabs() {
  const tabs = document.querySelectorAll('.editor-tabs [data-tab]');
  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      for (const other of tabs) other.setAttribute('aria-selected', String(other === tab));
      for (const pane of document.querySelectorAll('.editor-panes [data-pane]')) {
        pane.hidden = pane.dataset.pane !== tab.dataset.tab;
      }
    });
  }
}

async function init() {
  void initHeader();
  initTabs();

  contentInput.addEventListener('input', updatePreview);
  form.addEventListener('input', () => {
    dirty = true;
  });
  coverInput.addEventListener('change', handleCoverChange);
  coverRemove.addEventListener('click', () => {
    setCover(null);
    dirty = true;
  });
  form.addEventListener('submit', handleSubmit);
  deleteButton.addEventListener('click', handleDelete);
  window.addEventListener('beforeunload', (event) => {
    if (dirty) event.preventDefault();
  });

  await loadCategories();
  const slug = getQueryParam('slug');
  if (slug) {
    await loadPost(slug);
    if (getQueryParam('saved') === '1') showAlert(alertBox, 'Taslak kaydedildi.', 'success');
  }
}

if (requireAuth()) void init();
