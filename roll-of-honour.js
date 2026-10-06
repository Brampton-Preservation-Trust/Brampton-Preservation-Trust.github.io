(() => {
  'use strict';

  const triggers = document.querySelectorAll('[data-honour-open]');
  const dialogs = document.querySelectorAll('.honour-dialog');
  if (!triggers.length || !dialogs.length) return;

  let lastTrigger = null;

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
      dialog.dispatchEvent(new Event('close'));
    }
  }

  function openDialog(trigger) {
    const id = trigger.getAttribute('data-honour-open');
    const dialog = id ? document.getElementById(id) : null;
    if (!dialog) return;

    lastTrigger = trigger;
    document.body.classList.add('honour-dialog-open');

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    const closeButton = dialog.querySelector('[data-honour-close]');
    if (closeButton) closeButton.focus();
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => openDialog(trigger));
  });

  dialogs.forEach((dialog) => {
    dialog.querySelectorAll('[data-honour-close]').forEach((button) => {
      button.addEventListener('click', () => closeDialog(dialog));
    });

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });

    dialog.addEventListener('cancel', () => {
      document.body.classList.remove('honour-dialog-open');
    });

    dialog.addEventListener('close', () => {
      document.body.classList.remove('honour-dialog-open');
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
      lastTrigger = null;
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openDialogElement = document.querySelector('.honour-dialog[open]');
    if (openDialogElement && typeof openDialogElement.close !== 'function') {
      closeDialog(openDialogElement);
    }
  });
})();
