(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const submitButton = form.querySelector('.contact-submit input[type="submit"]');
  const packageField = form.querySelector('input[name="package"]');
  const referrerField = form.querySelector('input[name="referrer"]');
  const userAgentField = form.querySelector('input[name="userAgent"]');
  const pageField = form.querySelector('input[name="page"]');
  const statusBox = document.createElement('div');
  const defaultButtonLabel = submitButton ? submitButton.value : '';
  let successTimer = null;

  statusBox.className = 'form-status';
  statusBox.hidden = true;
  form.appendChild(statusBox);

  const messages = getMessages(pageField ? pageField.value : '');

  try {
    const params = new URLSearchParams(window.location.search);
    if (packageField) {
      packageField.value = params.get('pkg') || '';
    }
    if (referrerField) {
      referrerField.value = document.referrer || '';
    }
    if (userAgentField) {
      userAgentField.value = navigator.userAgent || '';
    }
  } catch (err) {
    // Ignore optional metadata errors so the form can still submit.
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus();

    if (!form.checkValidity()) {
      showStatus(messages.error, 'error');
      return;
    }

    setSubmitting(true);

    try {
      const payload = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: payload,
        mode: 'no-cors'
      });

      if (!reduce) burstFromButton();
      form.reset();
      if (packageField) {
        const params = new URLSearchParams(window.location.search);
        packageField.value = params.get('pkg') || '';
      }
      showStatus(messages.success, 'success');
    } catch (err) {
      showStatus(messages.error, 'error');
    } finally {
      setSubmitting(false);
    }
  });

  function burstFromButton() {
    const btn = submitButton;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const N = 24;

    for (let i = 0; i < N; i++) {
      const el = document.createElement('span');
      el.className = 'heart-cf';
      el.textContent = '❤';

      const angle = (i / N) * Math.PI * 2;
      const dist = 40 + Math.random() * 60;

      el.style.left = cx + 'px';
      el.style.top = cy + 'px';
      el.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      el.style.setProperty('--dy', Math.sin(angle) * dist - (80 + Math.random() * 80) + 'px');
      el.style.fontSize = (14 + Math.random() * 16) + 'px';
      el.style.animationDuration = (700 + Math.random() * 500) + 'ms';

      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }
  }

  function setSubmitting(isSubmitting) {
    if (!submitButton) return;
    submitButton.disabled = isSubmitting;
    submitButton.value = isSubmitting ? messages.sending : defaultButtonLabel;
  }

  function showStatus(text, kind) {
    if (successTimer) {
      clearTimeout(successTimer);
      successTimer = null;
    }

    statusBox.textContent = text;
    statusBox.classList.remove('is-success', 'is-error');
    statusBox.classList.add(kind === 'success' ? 'is-success' : 'is-error');
    statusBox.hidden = false;

    if (kind === 'success') {
      successTimer = setTimeout(() => {
        clearStatus();
      }, 5000);
    }
  }

  function clearStatus() {
    if (successTimer) {
      clearTimeout(successTimer);
      successTimer = null;
    }
    statusBox.hidden = true;
    statusBox.textContent = '';
    statusBox.classList.remove('is-success', 'is-error');
  }

  function getMessages(page) {
    if (page === 'contact-fi.html') {
      return {
        sending: 'Lahetetaan...',
        success: 'Viestisi on lahetetty. Kiitos, vastaan sinulle 1-2 arkipaivan kuluessa.',
        error: 'Jokin meni pieleen. Yrita uudelleen tai kirjoita suoraan osoitteeseen ph.hiilas@gmail.com tai Instagramiin.'
      };
    }

    if (page === 'contact-ru.html') {
      return {
        sending: 'Отправляем...',
        success: 'Ваше сообщение отправлено. Спасибо, я отвечу вам в течение 1-2 рабочих дней.',
        error: 'Что-то пошло не так. Попробуйте еще раз или напишите мне напрямую на ph.hiilas@gmail.com либо в Instagram.'
      };
    }

    return {
      sending: 'Sending...',
      success: 'Your message has been sent. Thank you, I will reply within 1-2 business days.',
      error: 'Something went wrong. Please try again, email me directly at ph.hiilas@gmail.com or write on Instagram.'
    };
  }
})();
