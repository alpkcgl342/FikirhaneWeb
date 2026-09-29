import { register } from '../auth.js';
import { clearErrors, hideAlert, setFieldError, setSubmitting, showAlert } from '../components/form.js';
import { getQueryParam, redirect, redirectIfLoggedIn, routes, safeNext } from '../router.js';

const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values) {
  const errors = {};
  if (!values.displayName) errors.displayName = 'Görünen ad gerekli';
  else if (values.displayName.length > 60) errors.displayName = 'Görünen ad en fazla 60 karakter olabilir';

  if (values.username.includes('@')) {
    errors.username = 'Buraya e-posta değil, kısa bir kullanıcı adı yazın (ör. ali_alp)';
  } else if (!USERNAME_PATTERN.test(values.username)) {
    errors.username = '3-30 karakter; yalnızca küçük harf, rakam ve _ kullanılabilir';
  }
  if (!EMAIL_PATTERN.test(values.email)) errors.email = 'Geçerli bir e-posta adresi girin';

  if (values.password.length < 8) errors.password = 'Şifre en az 8 karakter olmalı';
  else if (values.password.length > 72) errors.password = 'Şifre en fazla 72 karakter olabilir';

  if (values.passwordConfirm !== values.password) errors.passwordConfirm = 'Şifreler eşleşmiyor';
  return errors;
}

if (!redirectIfLoggedIn()) {
  const form = document.getElementById('register-form');
  const alert = document.getElementById('register-alert');
  const next = getQueryParam('next');

  const loginLink = document.getElementById('login-link');
  if (next) loginLink.href = `${routes.login}?next=${encodeURIComponent(next)}`;

  // Kullanıcı adını yazarken küçük harfe çevir.
  form.username.addEventListener('input', () => {
    const { selectionStart } = form.username;
    form.username.value = form.username.value.toLowerCase();
    form.username.setSelectionRange(selectionStart, selectionStart);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors(form);
    hideAlert(alert);

    const values = {
      displayName: form.displayName.value.trim(),
      username: form.username.value.trim().toLowerCase(),
      email: form.email.value.trim(),
      password: form.password.value,
      passwordConfirm: form.passwordConfirm.value,
    };

    const errors = validate(values);
    if (Object.keys(errors).length > 0) {
      for (const [name, message] of Object.entries(errors)) setFieldError(form, name, message);
      form.elements.namedItem(Object.keys(errors)[0])?.focus();
      return;
    }

    setSubmitting(form, true, 'Hesap oluşturuluyor…');
    try {
      const result = await register(values);
      if (result.emailConfirmationRequired) {
        form.reset();
        showAlert(
          alert,
          `Neredeyse tamam! ${values.email} adresine bir doğrulama bağlantısı gönderdik. ` +
            'E-postanızı doğruladıktan sonra giriş yapabilirsiniz.',
          'success',
        );
        setSubmitting(form, false);
        return;
      }
      redirect(safeNext(next));
    } catch (error) {
      if (error.status === 409 && /kullanıcı adı/i.test(error.message)) {
        setFieldError(form, 'username', error.message);
        form.username.focus();
      } else if (error.status === 409) {
        setFieldError(form, 'email', error.message);
        form.email.focus();
      } else {
        showAlert(alert, error.message);
      }
      setSubmitting(form, false);
    }
  });
}
