// Form hata/uyarı gösterimi için ortak yardımcılar

export function setFieldError(form, name, message) {
  const input = form.elements.namedItem(name);
  const error = form.querySelector(`[data-error-for="${name}"]`);
  if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (error) error.textContent = message ?? '';
}

export function clearErrors(form) {
  form.querySelectorAll('[data-error-for]').forEach((el) => {
    el.textContent = '';
  });
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.setAttribute('aria-invalid', 'false'));
}

export function showAlert(element, message, type = 'error') {
  element.className = `alert alert-${type}`;
  element.textContent = message;
  element.hidden = false;
}

export function hideAlert(element) {
  element.hidden = true;
  element.textContent = '';
}

export function setSubmitting(form, submitting, busyText) {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  if (submitting) {
    button.dataset.label = button.textContent;
    button.textContent = busyText;
  } else if (button.dataset.label) {
    button.textContent = button.dataset.label;
  }
  button.disabled = submitting;
}
