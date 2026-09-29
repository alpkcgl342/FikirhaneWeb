import { login, resendConfirmation } from '../auth.js';
import { clearErrors, hideAlert, setFieldError, setSubmitting, showAlert } from '../components/form.js';
import { getQueryParam, redirect, redirectIfLoggedIn, routes, safeNext } from '../router.js';

if (!redirectIfLoggedIn()) {
  const form = document.getElementById('login-form');
  const alert = document.getElementById('login-alert');
  const resendButton = document.getElementById('resend-confirmation');

  const registerLink = document.getElementById('register-link');
  const next = getQueryParam('next');
  if (next) registerLink.href = `${routes.register}?next=${encodeURIComponent(next)}`;

  // E-postadaki doğrulama bağlantısından dönüş
  const confirmed = getQueryParam('confirmed');
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
