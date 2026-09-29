import { login, resendConfirmation } from '../auth.js';
import { clearErrors, hideAlert, setFieldError, setSubmitting, showAlert } from '../components/form.js';
import { getQueryParam, redirect, redirectIfLoggedIn, routes, safeNext } from '../router.js';

/**
 * Doğrulama sonucunu okur ve adresi temizler. Supabase doğrulamadan sonra buraya
 * `?confirmed=1` ile yönlendirir ve adresin # kısmına oturum token'larını (başarılı) ya da
 * `error_code` bilgisini (başarısız) ekler. Token'lar kullanılmaz; geçmişte kalmamaları için
 * adresten silinir.
 */
function readConfirmationResult() {
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const failed = hash.has('error') || hash.has('error_code') || url.searchParams.has('error');
  const result = failed ? '0' : url.searchParams.get('confirmed');

  if (url.hash || result !== null) {
    for (const key of ['confirmed', 'error', 'error_code', 'error_description']) {
      url.searchParams.delete(key);
    }
    url.hash = '';
    window.history.replaceState(null, '', url.pathname + url.search);
  }
  return result;
}

if (!redirectIfLoggedIn()) {
  const form = document.getElementById('login-form');
  const alert = document.getElementById('login-alert');
  const resendButton = document.getElementById('resend-confirmation');

  const registerLink = document.getElementById('register-link');
  const next = getQueryParam('next');
  if (next) registerLink.href = `${routes.register}?next=${encodeURIComponent(next)}`;

  // E-postadaki doğrulama bağlantısından dönüş
  const confirmed = readConfirmationResult();
  if (confirmed === '1') {
    showAlert(alert, 'E-posta adresiniz doğrulandı. Artık giriş yapabilirsiniz.', 'success');
  } else if (confirmed === '0') {
    showAlert(
      alert,
      'Doğrulama bağlantısı geçersiz ya da süresi dolmuş. Giriş yapmayı deneyerek yeni bir bağlantı isteyebilirsiniz.',
    );
  }

  resendButton.addEventListener('click', async () => {
    const email = form.email.value.trim();
    if (!email) {
      setFieldError(form, 'email', 'E-posta gerekli');
      return;
    }
    resendButton.disabled = true;
    try {
      const { message } = await resendConfirmation(email);
      showAlert(alert, message, 'success');
      resendButton.hidden = true;
    } catch (error) {
      showAlert(alert, error.message);
    } finally {
      resendButton.disabled = false;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors(form);
    hideAlert(alert);
    resendButton.hidden = true;

    const email = form.email.value.trim();
    const password = form.password.value;

    let valid = true;
    if (!email) {
      setFieldError(form, 'email', 'E-posta gerekli');
      valid = false;
    }
    if (!password) {
      setFieldError(form, 'password', 'Şifre gerekli');
      valid = false;
    }
    if (!valid) return;

    setSubmitting(form, true, 'Giriş yapılıyor…');
    try {
      await login(email, password);
      redirect(safeNext(next));
    } catch (error) {
      showAlert(alert, error.message);
      // 403: e-posta henüz doğrulanmamış
      if (error.status === 403) resendButton.hidden = false;
      setSubmitting(form, false);
    }
  });
}
