// Şikâyet penceresi (<dialog>). Giriş yapmamış kullanıcı giriş sayfasına yönlendirilir.

import { isLoggedIn } from '../auth.js';
import { createReport } from '../moderation.js';
import { redirect, routes } from '../router.js';

const TITLES = {
  POST: 'Yazıyı şikâyet et',
  COMMENT: 'Yorumu şikâyet et',
  USER: 'Kullanıcıyı şikâyet et',
};

let dialog = null;

function build() {
  dialog = document.createElement('dialog');
  dialog.className = 'report-dialog';
  dialog.setAttribute('aria-labelledby', 'report-title');
  dialog.innerHTML = `
    <form method="dialog" class="form" novalidate>
      <h2 id="report-title"></h2>
      <p class="form-hint">Şikâyetin moderatörler tarafından incelenir. Kim olduğun şikâyet edilen kişiye gösterilmez.</p>
      <div class="form-field">
        <label for="report-reason">Neden?</label>
        <textarea id="report-reason" name="reason" rows="4" maxlength="1000"
          placeholder="ör. hakaret, spam, yanıltıcı içerik…"></textarea>
        <span class="form-error" data-report-error></span>
      </div>
      <div class="dialog-actions">
        <button type="button" class="btn btn-ghost" data-cancel>Vazgeç</button>
        <button type="submit" class="btn btn-danger" data-submit>Şikâyet et</button>
      </div>
    </form>`;
  document.body.append(dialog);
  dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close());
  return dialog;
}

/** Şikâyet penceresini açar; gönderildiğinde true ile çözülür. */
export function openReportDialog(targetType, targetId) {
  if (!isLoggedIn()) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    redirect(`${routes.login}?next=${next}`);
    return Promise.resolve(false);
  }

  const box = dialog ?? build();
  const form = box.querySelector('form');
  const textarea = box.querySelector('textarea');
  const error = box.querySelector('[data-report-error]');
  const submit = box.querySelector('[data-submit]');

  box.querySelector('#report-title').textContent = TITLES[targetType];
  textarea.value = '';
  error.textContent = '';
  submit.disabled = false;

  return new Promise((resolve) => {
    const onSubmit = async (event) => {
      event.preventDefault();
      const reason = textarea.value.trim();
      if (reason.length < 5) {
        error.textContent = 'Lütfen nedenini en az 5 karakterle yaz';
        textarea.focus();
        return;
      }
      submit.disabled = true;
      try {
        await createReport(targetType, targetId, reason);
        cleanup();
        box.close();
        resolve(true);
      } catch (err) {
        error.textContent = err.message;
        submit.disabled = false;
      }
    };
    const onClose = () => {
      cleanup();
      resolve(false);
    };
    function cleanup() {
      form.removeEventListener('submit', onSubmit);
      box.removeEventListener('close', onClose);
    }
    form.addEventListener('submit', onSubmit);
    box.addEventListener('close', onClose);
    box.showModal();
    textarea.focus();
  });
}
